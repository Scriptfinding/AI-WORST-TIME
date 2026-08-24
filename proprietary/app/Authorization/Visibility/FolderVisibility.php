<?php

namespace App\Authorization\Visibility;

use App\Authorization\AuthorizationContext;
use App\Authorization\ScopeEvaluator;
use App\Models\Folder;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

final class FolderVisibility
{
    public function __construct(
        private readonly ScopeEvaluator $scopes,
        private readonly FeatureFlagService $features,
    ) {}

    /**
     * @param  Builder<Folder>  $query
     * @return Builder<Folder>
     */
    public function apply(Builder $query, AuthorizationContext $context): Builder
    {
        $model = $query->getModel();
        $workspaceColumn = $model->qualifyColumn('workspace_id');
        $sharedColumn = $model->qualifyColumn('is_shared');
        $ownerColumn = $model->qualifyColumn('owner_id');
        $teamColumn = $model->qualifyColumn('team_id');

        $query->where($workspaceColumn, $context->workspaceId);

        if ($this->scopes->isAdministrator($context)) {
            return $query;
        }

        return $query->where(function (Builder $visibility) use ($context, $sharedColumn, $ownerColumn, $teamColumn) {
            $visibility->where(function (Builder $personal) use ($context, $sharedColumn, $ownerColumn) {
                $personal->where($sharedColumn, false)
                    ->where($ownerColumn, $context->user->id);
            });

            if ($context->workspaceSharingEnabled && $context->isWorkspaceMember) {
                $visibility->orWhere(function (Builder $workspace) use ($sharedColumn, $teamColumn) {
                    $workspace->where($sharedColumn, true)->whereNull($teamColumn);
                });
            }

            if ($context->teamsEnabled && $context->teamIds !== []) {
                $visibility->orWhere(function (Builder $team) use ($context, $sharedColumn, $teamColumn) {
                    $team->where($sharedColumn, true)
                        ->whereIn($teamColumn, $context->teamIds);
                });
            }
        });
    }

    /**
     * @param  Builder<Folder>  $query
     * @return Builder<Folder>
     */
    public function applyForUser(Builder $query, User $user, ?string $workspaceId = null): Builder
    {
        $model = $query->getModel();
        $workspaceColumn = $model->qualifyColumn('workspace_id');
        $sharedColumn = $model->qualifyColumn('is_shared');
        $ownerColumn = $model->qualifyColumn('owner_id');
        $teamColumn = $model->qualifyColumn('team_id');

        if ($workspaceId !== null) {
            $query->where($workspaceColumn, $workspaceId);
        }

        if ($user->isAdmin()) {
            return $query;
        }

        $query->whereIn($workspaceColumn, DB::table('workspaces')
            ->select('workspaces.id')
            ->where(function ($workspaces) {
                $workspaces->whereNull('workspaces.expires_at')
                    ->orWhere('workspaces.expires_at', '>', now());
            }));

        return $query->where(function (Builder $visibility) use ($user, $workspaceColumn, $sharedColumn, $ownerColumn, $teamColumn) {
            $visibility->where(function (Builder $personal) use ($user, $sharedColumn, $ownerColumn) {
                $personal->where($sharedColumn, false)
                    ->where($ownerColumn, $user->id);
            });

            if ($this->features->workspaceSharingEnabled()) {
                $visibility->orWhere(function (Builder $workspace) use ($user, $workspaceColumn, $sharedColumn, $teamColumn) {
                    $workspace->where($sharedColumn, true)
                        ->whereNull($teamColumn)
                        ->whereIn($workspaceColumn, DB::table('user_workspace')
                            ->select('user_workspace.workspace_id')
                            ->where('user_workspace.user_id', $user->id));
                });
            }

            if ($this->features->teamsEnabled()) {
                $visibility->orWhere(function (Builder $team) use ($user, $sharedColumn, $teamColumn) {
                    $team->where($sharedColumn, true)
                        ->whereIn($teamColumn, DB::table('team_user')
                            ->select('team_user.team_id')
                            ->where('team_user.user_id', $user->id));
                });
            }
        });
    }
}
