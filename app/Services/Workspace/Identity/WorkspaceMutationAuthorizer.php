<?php

namespace App\Services\Workspace\Identity;

use App\Authorization\AuthorizationContextFactory;
use App\Enums\Authorization\Ability;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceTeam;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Gate;

final class WorkspaceMutationAuthorizer
{
    public function __construct(
        private readonly AuthorizationContextFactory $authorizationContexts,
    ) {}

    public function workspace(?User $actor, Ability $ability, Workspace $workspace): void
    {
        if ($actor === null) {
            return;
        }

        $this->authorizationContexts->forget();
        Gate::forUser($actor)->authorize($ability->value, $workspace);
    }

    public function create(?User $actor): void
    {
        if ($actor === null) {
            return;
        }

        $this->authorizationContexts->forget();
        Gate::forUser($actor)->authorize(Ability::CREATE->value, Workspace::class);
    }

    public function membership(
        ?User $actor,
        Workspace $workspace,
        ?string $nextRole = null,
        ?string $currentRole = null,
    ): void {
        $this->workspace($actor, Ability::MANAGE_MEMBERS, $workspace);

        if ($actor !== null && ($nextRole === 'admin' || $currentRole === 'admin')) {
            $this->workspace($actor, Ability::UPDATE, $workspace);
        }
    }

    /**
     * @param  list<string|null>  $affectedRoles
     */
    public function teamMembership(
        ?User $actor,
        Workspace $workspace,
        WorkspaceTeam $team,
        ?string $nextRole = null,
        array $affectedRoles = [],
        bool $allowMemberProvisioning = false,
    ): void {
        if ($actor === null) {
            return;
        }

        if ($team->workspace_id !== $workspace->id) {
            throw new AuthorizationException;
        }

        $this->authorizationContexts->forget();
        Gate::forUser($actor)->authorize(Ability::MANAGE_MEMBERS->value, $team);

        if (Gate::forUser($actor)->allows(Ability::UPDATE->value, $workspace)) {
            return;
        }

        $invalidNextRole = $nextRole !== null
            && (! $allowMemberProvisioning || $nextRole !== 'member');
        $invalidAffectedRole = collect($affectedRoles)->contains(
            fn (?string $role): bool => $role !== 'member'
                && ! ($allowMemberProvisioning && $role === null),
        );

        if ($invalidNextRole || $invalidAffectedRole) {
            throw new AuthorizationException;
        }
    }

    public function crossWorkspace(?User $actor): void
    {
        if ($actor === null) {
            return;
        }

        if (! $actor->isAdmin()) {
            throw new AuthorizationException;
        }

        $this->authorizationContexts->forget();
    }
}
