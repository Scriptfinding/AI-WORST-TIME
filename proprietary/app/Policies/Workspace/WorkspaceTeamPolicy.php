<?php

namespace App\Policies\Workspace;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ScopeEvaluator;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceTeam;

class WorkspaceTeamPolicy
{
    public function __construct(
        private readonly AuthorizationContextFactory $contexts,
        private readonly ScopeEvaluator $scopes,
    ) {}

    public function viewAny(User $user, Workspace $workspace): bool
    {
        return $this->canViewWorkspace($user, $workspace);
    }

    public function view(User $user, WorkspaceTeam $team): bool
    {
        $workspace = Workspace::find($team->workspace_id);

        if ($workspace === null) {
            return false;
        }

        $context = $this->contexts->for($user, $workspace->id);

        return $this->scopes->canEnterWorkspace($context, $workspace->id)
            && ($this->scopes->isAdministrator($context) || $context->hasTeam($team->id));
    }

    public function create(User $user, Workspace $workspace): bool
    {
        return $this->canAdministerWorkspace($user, $workspace);
    }

    public function update(User $user, WorkspaceTeam $team): bool
    {
        $workspace = Workspace::find($team->workspace_id);

        return $workspace !== null && $this->canAdministerWorkspace($user, $workspace);
    }

    public function delete(User $user, WorkspaceTeam $team): bool
    {
        return $this->update($user, $team);
    }

    public function manageMembers(User $user, WorkspaceTeam $team): bool
    {
        $workspace = Workspace::find($team->workspace_id);
        if ($workspace === null) {
            return false;
        }

        $context = $this->contexts->for($user, $workspace->id);

        return $this->scopes->canEnterWorkspace($context, $workspace->id)
            && (
                $this->scopes->isAdministrator($context)
                || (
                    $context->workspaceSharingEnabled
                    && $context->teamsEnabled
                    && $context->workspaceRole === 'manager'
                    && $context->hasTeam($team->id)
                )
            );
    }

    private function canViewWorkspace(User $user, Workspace $workspace): bool
    {
        return $this->scopes->canEnterWorkspace(
            $this->contexts->for($user, $workspace->id),
            $workspace->id,
        );
    }

    private function canAdministerWorkspace(User $user, Workspace $workspace): bool
    {
        $context = $this->contexts->for($user, $workspace->id);

        return $this->scopes->canEnterWorkspace($context, $workspace->id)
            && $this->scopes->isAdministrator($context);
    }
}
