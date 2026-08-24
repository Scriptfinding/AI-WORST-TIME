<?php

namespace App\Policies\Workspace;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ScopeEvaluator;
use App\Models\User;
use App\Models\Workspace;

class WorkspacePolicy
{
    public function __construct(
        private readonly AuthorizationContextFactory $contexts,
        private readonly ScopeEvaluator $scopes,
    ) {}

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Workspace $workspace): bool
    {
        return $this->canAccess($user, $workspace)
            && $this->scopes->canEnterWorkspace(
                $this->contexts->for($user, $workspace->id),
                $workspace->id,
            );
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->can_create_workspace;
    }

    public function update(User $user, Workspace $workspace): bool
    {
        return $this->canAdminister($user, $workspace);
    }

    public function delete(User $user, Workspace $workspace): bool
    {
        return $this->canAdminister($user, $workspace);
    }

    public function transferOwnership(User $user, Workspace $workspace): bool
    {
        return $user->isAdmin()
            || (! $workspace->isExpired() && $workspace->owner_id === $user->id);
    }

    public function manageMembers(User $user, Workspace $workspace): bool
    {
        if (! $this->canAccess($user, $workspace)) {
            return false;
        }

        $context = $this->contexts->for($user, $workspace->id);

        return $this->scopes->canEnterWorkspace($context, $workspace->id)
            && $this->scopes->isAdministrator($context);
    }

    private function canAdminister(User $user, Workspace $workspace): bool
    {
        if (! $this->canAccess($user, $workspace)) {
            return false;
        }

        $context = $this->contexts->for($user, $workspace->id);

        return $this->scopes->canEnterWorkspace($context, $workspace->id)
            && ($context->isInstanceAdmin()
                || ($context->workspaceSharingEnabled && $context->workspaceRole === 'admin'));
    }

    private function canAccess(User $user, Workspace $workspace): bool
    {
        return $user->isAdmin() || ! $workspace->isExpired();
    }
}
