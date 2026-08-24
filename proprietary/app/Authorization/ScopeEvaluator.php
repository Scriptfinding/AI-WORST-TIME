<?php

namespace App\Authorization;

final class ScopeEvaluator
{
    public function canView(
        AuthorizationContext $context,
        string $workspaceId,
        ?string $ownerId,
        string $scope,
        ?string $teamId = null,
    ): bool {
        if (! $this->canEnterWorkspace($context, $workspaceId)) {
            return false;
        }

        return $this->isAdministrator($context)
            || $ownerId === $context->user->id
            || $this->canUse($context, $workspaceId, $ownerId, $scope, $teamId);
    }

    public function canManage(
        AuthorizationContext $context,
        string $workspaceId,
        ?string $ownerId,
    ): bool {
        return $this->canEnterWorkspace($context, $workspaceId)
            && ($this->isAdministrator($context) || $ownerId === $context->user->id);
    }

    public function canUse(
        AuthorizationContext $context,
        string $workspaceId,
        ?string $ownerId,
        string $scope,
        ?string $teamId = null,
    ): bool {
        if ($context->workspaceId !== $workspaceId) {
            return false;
        }

        if ($context->isInstanceAdmin()) {
            return true;
        }

        return $this->canAccessScope($context, $ownerId, $scope, $teamId);
    }

    public function canEnterWorkspace(AuthorizationContext $context, string $workspaceId): bool
    {
        return $context->workspaceId === $workspaceId
            && ($context->isWorkspaceMember || $context->isInstanceAdmin());
    }

    public function isAdministrator(AuthorizationContext $context): bool
    {
        if ($context->isInstanceAdmin()) {
            return true;
        }

        return $context->workspaceSharingEnabled
            && $context->workspaceRole === 'admin';
    }

    public function canTransferOwnership(
        AuthorizationContext $context,
        string $currentOwnerId,
        ?string $currentOwnerRole,
    ): bool {
        if ($context->user->id === $currentOwnerId || $context->isInstanceAdmin()) {
            return true;
        }

        if (! $context->workspaceSharingEnabled) {
            return false;
        }

        $hierarchy = ['member' => 0, 'manager' => 1, 'admin' => 2];
        $requesterRole = $context->workspaceRole ?? 'member';
        $ownerRole = $currentOwnerRole ?? 'member';

        return $requesterRole === 'admin'
            || ($hierarchy[$requesterRole] ?? 0) > ($hierarchy[$ownerRole] ?? 0);
    }

    private function canAccessScope(
        AuthorizationContext $context,
        ?string $ownerId,
        string $scope,
        ?string $teamId,
    ): bool {
        return match ($scope) {
            'owner', 'user' => $ownerId === $context->user->id,
            'workspace' => $context->workspaceSharingEnabled && $context->isWorkspaceMember,
            'team' => $context->teamsEnabled && $context->hasTeam($teamId),
            default => false,
        };
    }
}
