<?php

namespace App\Authorization;

use App\Models\User;

final readonly class AuthorizationContext
{
    /**
     * @param  list<string>  $teamIds
     */
    public function __construct(
        public User $user,
        public string $workspaceId,
        public bool $isWorkspaceMember,
        public ?string $workspaceRole,
        public array $teamIds,
        public bool $workspaceSharingEnabled,
        public bool $teamsEnabled,
    ) {}

    public function isInstanceAdmin(): bool
    {
        return $this->user->isAdmin();
    }

    public function hasTeam(?string $teamId): bool
    {
        return $teamId !== null && in_array($teamId, $this->teamIds, true);
    }
}
