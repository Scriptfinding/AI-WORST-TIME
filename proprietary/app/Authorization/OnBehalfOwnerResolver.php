<?php

namespace App\Authorization;

use App\Models\User;

/**
 * Resolves the user a personal resource belongs to when an instance admin
 * acts on behalf of another workspace member (e.g. while browsing that
 * user's personal space in the explorer).
 */
final class OnBehalfOwnerResolver
{
    /**
     * Strict variant for mutations: only instance admins may act for someone
     * else, and the target must be a member of the workspace.
     */
    public function resolveOrFail(User $actor, string $workspaceId, string $requestedOwnerId): User
    {
        if ($requestedOwnerId === $actor->id) {
            return $actor;
        }

        abort_unless($actor->isAdmin(), 403);

        return $this->workspaceMember($workspaceId, $requestedOwnerId) ?? abort(404);
    }

    /**
     * Lenient variant for page rendering: falls back to the actor when the
     * requested owner cannot be impersonated.
     */
    public function resolveOrFallback(User $actor, string $workspaceId, ?string $requestedOwnerId): User
    {
        if ($requestedOwnerId === null || $requestedOwnerId === $actor->id || ! $actor->isAdmin()) {
            return $actor;
        }

        return $this->workspaceMember($workspaceId, $requestedOwnerId) ?? $actor;
    }

    private function workspaceMember(string $workspaceId, string $userId): ?User
    {
        return User::whereHas(
            'workspaces',
            fn ($query) => $query->where('workspaces.id', $workspaceId),
        )->find($userId);
    }
}
