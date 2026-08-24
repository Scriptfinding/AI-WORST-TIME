<?php

namespace App\Authorization\Visibility;

use App\Authorization\AuthorizationContext;
use App\Authorization\ScopeEvaluator;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

final class FlowVisibility
{
    public function __construct(
        private readonly ScopeEvaluator $scopes,
        private readonly FeatureFlagService $features,
    ) {}

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    public function apply(Builder $query, AuthorizationContext $context): Builder
    {
        $model = $query->getModel();
        $workspaceColumn = $model->qualifyColumn('workspace_id');
        $ownerColumn = $model->qualifyColumn('owner_id');
        $visibilityColumn = $model->qualifyColumn('visibility');
        $teamColumn = $model->qualifyColumn('team_id');

        $query->where($workspaceColumn, $context->workspaceId);

        if ($this->scopes->isAdministrator($context)) {
            return $query;
        }

        return $query->where(function (Builder $visibility) use ($context, $ownerColumn, $visibilityColumn, $teamColumn) {
            $visibility->where($ownerColumn, $context->user->id);

            if ($context->workspaceSharingEnabled && $context->isWorkspaceMember) {
                $visibility->orWhere($visibilityColumn, 'workspace');
            }

            if ($context->teamsEnabled && $context->teamIds !== []) {
                $visibility->orWhere(function (Builder $team) use ($context, $visibilityColumn, $teamColumn) {
                    $team->where($visibilityColumn, 'team')
                        ->whereIn($teamColumn, $context->teamIds);
                });
            }
        });
    }

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    public function applyForUser(Builder $query, User $user, ?string $workspaceId = null): Builder
    {
        $model = $query->getModel();
        $workspaceColumn = $model->qualifyColumn('workspace_id');
        $ownerColumn = $model->qualifyColumn('owner_id');
        $visibilityColumn = $model->qualifyColumn('visibility');
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

        return $query->where(function (Builder $visibility) use ($user, $workspaceColumn, $ownerColumn, $visibilityColumn, $teamColumn) {
            $visibility->where(function (Builder $owner) use ($user, $workspaceColumn, $ownerColumn) {
                $owner->where($ownerColumn, $user->id)
                    ->whereIn($workspaceColumn, DB::table('user_workspace')
                        ->select('user_workspace.workspace_id')
                        ->where('user_workspace.user_id', $user->id));
            });

            if ($this->features->workspaceSharingEnabled()) {
                $visibility->orWhereIn($workspaceColumn, DB::table('user_workspace')
                    ->select('user_workspace.workspace_id')
                    ->where('user_workspace.user_id', $user->id)
                    ->where('user_workspace.role', 'admin'));

                $visibility->orWhere(function (Builder $workspace) use ($user, $workspaceColumn, $visibilityColumn) {
                    $workspace->where($visibilityColumn, 'workspace')
                        ->whereIn($workspaceColumn, DB::table('user_workspace')
                            ->select('user_workspace.workspace_id')
                            ->where('user_workspace.user_id', $user->id));
                });
            }

            if ($this->features->teamsEnabled()) {
                $visibility->orWhere(function (Builder $team) use ($user, $visibilityColumn, $teamColumn) {
                    $team->where($visibilityColumn, 'team')
                        ->whereIn($teamColumn, DB::table('team_user')
                            ->select('team_user.team_id')
                            ->where('team_user.user_id', $user->id));
                });
            }
        });
    }
}
