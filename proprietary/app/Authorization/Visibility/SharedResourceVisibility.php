<?php

namespace App\Authorization\Visibility;

use App\Authorization\AuthorizationContext;
use App\Authorization\ScopeEvaluator;
use Illuminate\Database\Eloquent\Builder;

final class SharedResourceVisibility
{
    public function __construct(
        private readonly ScopeEvaluator $scopes,
    ) {}

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    public function applyView(
        Builder $query,
        AuthorizationContext $context,
        string $workspaceColumn = 'workspace_id',
        string $ownerColumn = 'user_id',
        string $scopeColumn = 'scope',
        string $teamColumn = 'team_id',
        bool $includeUnowned = false,
    ): Builder {
        $workspaceColumn = $query->getModel()->qualifyColumn($workspaceColumn);
        $ownerColumn = $query->getModel()->qualifyColumn($ownerColumn);
        $scopeColumn = $query->getModel()->qualifyColumn($scopeColumn);
        $teamColumn = $query->getModel()->qualifyColumn($teamColumn);

        $query->where($workspaceColumn, $context->workspaceId);

        if ($this->scopes->isAdministrator($context)) {
            return $query;
        }

        return $query->where(function (Builder $visibility) use (
            $context,
            $ownerColumn,
            $scopeColumn,
            $teamColumn,
            $includeUnowned,
        ) {
            $visibility->where($ownerColumn, $context->user->id);

            if ($context->workspaceSharingEnabled && $context->isWorkspaceMember) {
                $visibility->orWhere($scopeColumn, 'workspace');
            }

            if ($context->teamsEnabled && $context->teamIds !== []) {
                $visibility->orWhere(function (Builder $team) use ($scopeColumn, $teamColumn, $context) {
                    $team->where($scopeColumn, 'team')
                        ->whereIn($teamColumn, $context->teamIds);
                });
            }

            if ($includeUnowned) {
                $visibility->orWhereNull($ownerColumn);
            }
        });
    }

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    public function applyUse(
        Builder $query,
        AuthorizationContext $context,
        string $workspaceColumn = 'workspace_id',
        string $ownerColumn = 'user_id',
        string $scopeColumn = 'scope',
        string $teamColumn = 'team_id',
    ): Builder {
        $workspaceColumn = $query->getModel()->qualifyColumn($workspaceColumn);
        $ownerColumn = $query->getModel()->qualifyColumn($ownerColumn);
        $scopeColumn = $query->getModel()->qualifyColumn($scopeColumn);
        $teamColumn = $query->getModel()->qualifyColumn($teamColumn);

        $query->where($workspaceColumn, $context->workspaceId);

        if ($context->isInstanceAdmin()) {
            return $query;
        }

        return $query->where(function (Builder $visibility) use (
            $context,
            $ownerColumn,
            $scopeColumn,
            $teamColumn,
        ) {
            $visibility->where(function (Builder $personal) use ($ownerColumn, $scopeColumn, $context) {
                $personal->whereIn($scopeColumn, ['owner', 'user'])
                    ->where($ownerColumn, $context->user->id);
            });

            if ($context->workspaceSharingEnabled && $context->isWorkspaceMember) {
                $visibility->orWhere($scopeColumn, 'workspace');
            }

            if ($context->teamsEnabled && $context->teamIds !== []) {
                $visibility->orWhere(function (Builder $team) use ($scopeColumn, $teamColumn, $context) {
                    $team->where($scopeColumn, 'team')
                        ->whereIn($teamColumn, $context->teamIds);
                });
            }
        });
    }
}
