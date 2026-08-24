<?php

namespace App\Services\Workspace;

use App\Models\User;
use App\Models\Workspace;
use App\Services\Workspace\Identity\IdentityRows;
use App\Services\Workspace\Identity\IdentityTransaction;
use App\Services\Workspace\Identity\WorkspaceIdentityRules;
use App\Services\Workspace\Identity\WorkspaceMembershipStore;
use App\Services\Workspace\Identity\WorkspaceMutationAuthorizer;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class WorkspaceMembershipManager
{
    public function __construct(
        private readonly IdentityTransaction $transactions,
        private readonly IdentityRows $rows,
        private readonly WorkspaceMembershipStore $store,
        private readonly WorkspaceIdentityRules $rules,
        private readonly WorkspaceMutationAuthorizer $authorizer,
    ) {}

    public function attach(
        Workspace $workspace,
        User $user,
        string $role = 'member',
        ?User $actor = null,
    ): void {
        $this->transactions->run(function () use ($workspace, $user, $role, $actor): void {
            $role = $this->rules->role($role);
            $lockedUsers = $this->rows->users([$actor?->id, $user->id])->keyBy('id');
            $lockedWorkspace = $this->rows->workspaces([$workspace->id])->firstOrFail();
            /** @var User|null $lockedActor */
            $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
            $this->authorizer->membership($lockedActor, $lockedWorkspace, $role);

            if ($this->store->role($lockedWorkspace->id, $user->id) !== null) {
                throw ValidationException::withMessages([
                    'user' => 'This user is already a member of this workspace.',
                ]);
            }

            $this->store->insert($lockedWorkspace->id, $user->id, $role);
        });
    }

    public function changeRole(
        Workspace $workspace,
        User $user,
        string $role,
        ?User $actor = null,
        ?bool $canCreateWorkspace = null,
    ): void {
        $this->transactions->run(function () use (
            $workspace,
            $user,
            $role,
            $actor,
            $canCreateWorkspace,
        ): void {
            $role = $this->rules->role($role);
            $lockedUsers = $this->rows->users([$actor?->id, $user->id])->keyBy('id');
            $lockedWorkspace = $this->rows->workspaces([$workspace->id])->firstOrFail();
            /** @var User $lockedUser */
            $lockedUser = $lockedUsers->get($user->id);
            /** @var User|null $lockedActor */
            $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
            $currentRole = $this->store->role($lockedWorkspace->id, $lockedUser->id);

            if ($currentRole === null) {
                throw (new ModelNotFoundException)->setModel(User::class, [$user->id]);
            }

            $this->authorizer->membership($lockedActor, $lockedWorkspace, $role, $currentRole);
            $this->assertInstanceAdminUntouchable($lockedActor, $lockedUser);
            $this->rules->ownerRemainsAdmin($lockedWorkspace, $lockedUser->id, $role);
            $this->rules->adminChangeIsSafe($lockedWorkspace->id, $lockedUser->id, $currentRole, $role);

            if ($canCreateWorkspace !== null) {
                if ($lockedActor === null || ! $lockedActor->isAdmin()) {
                    throw new AuthorizationException;
                }
                $lockedUser->forceFill(['can_create_workspace' => $canCreateWorkspace])->save();
            }

            $this->store->updateRole($lockedWorkspace->id, $lockedUser->id, $role);
        });
    }

    public function remove(Workspace $workspace, User $user, ?User $actor = null): void
    {
        $this->transactions->run(function () use ($workspace, $user, $actor): void {
            $lockedUsers = $this->rows->users([$actor?->id, $user->id])->keyBy('id');
            $lockedWorkspace = $this->rows->workspaces([$workspace->id])->firstOrFail();
            /** @var User $lockedUser */
            $lockedUser = $lockedUsers->get($user->id);
            /** @var User|null $lockedActor */
            $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
            $currentRole = $this->store->role($lockedWorkspace->id, $user->id);

            if ($currentRole === null) {
                throw (new ModelNotFoundException)->setModel(User::class, [$user->id]);
            }

            $this->authorizer->membership($lockedActor, $lockedWorkspace, null, $currentRole);
            $this->assertInstanceAdminUntouchable($lockedActor, $lockedUser);

            if ($lockedWorkspace->owner_id === $user->id) {
                throw ValidationException::withMessages([
                    'member' => 'Transfer workspace ownership before removing its owner.',
                ]);
            }

            $this->rules->adminChangeIsSafe($lockedWorkspace->id, $user->id, $currentRole, null);
            $this->assertNotLeavingLastWorkspace($lockedActor, $lockedUser, $lockedWorkspace);
            $this->store->delete($lockedWorkspace->id, $user->id);
        });
    }

    /**
     * A user removing themself from their only workspace would strand the
     * account on the "no workspace" screen with no way back. Instance
     * admins are exempt: they can always re-attach themselves.
     */
    private function assertNotLeavingLastWorkspace(?User $actor, User $target, Workspace $workspace): void
    {
        if ($actor === null || $actor->id !== $target->id || $target->isAdmin()) {
            return;
        }

        $belongsElsewhere = DB::table('user_workspace')
            ->where('user_id', $target->id)
            ->where('workspace_id', '!=', $workspace->id)
            ->exists();

        if (! $belongsElsewhere) {
            throw ValidationException::withMessages([
                'member' => 'You cannot remove yourself from your only workspace.',
            ]);
        }
    }

    /**
     * Instance administrators can only be managed by other instance
     * administrators; a workspace admin must not demote or evict them.
     * A null actor is a trusted system context and stays unrestricted.
     */
    private function assertInstanceAdminUntouchable(?User $actor, User $target): void
    {
        if ($actor !== null && $target->isAdmin() && ! $actor->isAdmin()) {
            throw new AuthorizationException('Only an instance administrator can manage this member.');
        }
    }

    /**
     * @param  array<string, string>  $memberships
     */
    public function replace(User $user, array $memberships, ?User $actor = null): void
    {
        $this->transactions->run(function () use ($user, $memberships, $actor): void {
            $memberships = $this->rules->memberships($memberships);
            $lockedUsers = $this->rows->users([$actor?->id, $user->id])->keyBy('id');
            /** @var User|null $lockedActor */
            $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
            $this->authorizer->crossWorkspace($lockedActor);
            $current = DB::table('user_workspace')
                ->where('user_id', $user->id)
                ->pluck('role', 'workspace_id')
                ->mapWithKeys(fn (mixed $role, string $id) => is_string($role)
                    ? [$id => $role]
                    : throw new \UnexpectedValueException('Workspace membership role must be a string.'))
                ->all();
            $workspaceIds = $this->rules->ids([
                ...array_keys($current),
                ...array_keys($memberships),
            ]);
            $lockedWorkspaces = $this->rows->workspaces($workspaceIds)->keyBy('id');

            if ($lockedWorkspaces->count() !== count($workspaceIds)) {
                throw (new ModelNotFoundException)->setModel(Workspace::class, $workspaceIds);
            }

            foreach ($current as $workspaceId => $currentRole) {
                /** @var Workspace $lockedWorkspace */
                $lockedWorkspace = $lockedWorkspaces->get($workspaceId);
                $nextRole = $memberships[$workspaceId] ?? null;
                $this->rules->ownerRemainsAdmin($lockedWorkspace, $user->id, $nextRole);
                $this->rules->adminChangeIsSafe($workspaceId, $user->id, $currentRole, $nextRole);
            }

            foreach ($memberships as $workspaceId => $role) {
                isset($current[$workspaceId])
                    ? $this->store->updateRole($workspaceId, $user->id, $role)
                    : $this->store->insert($workspaceId, $user->id, $role);
            }

            foreach (array_diff(array_keys($current), array_keys($memberships)) as $workspaceId) {
                $this->store->delete($workspaceId, $user->id);
            }
        });
    }

    public function prepareUserDeletion(User $user, ?User $actor = null): void
    {
        $this->transactions->run(function () use ($user, $actor): void {
            $lockedUsers = $this->rows->users([$actor?->id, $user->id])->keyBy('id');
            /** @var User|null $lockedActor */
            $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
            $this->authorizer->crossWorkspace($lockedActor);
            $current = DB::table('user_workspace')
                ->where('user_id', $user->id)
                ->pluck('role', 'workspace_id')
                ->mapWithKeys(fn (mixed $role, string $id) => is_string($role)
                    ? [$id => $role]
                    : throw new \UnexpectedValueException('Workspace membership role must be a string.'))
                ->all();
            $ownedIds = Workspace::query()
                ->where('owner_id', $user->id)
                ->pluck('id')
                ->filter(fn (mixed $id): bool => is_string($id))
                ->values()
                ->all();
            $workspaceIds = $this->rules->ids([...array_keys($current), ...$ownedIds]);
            $this->rows->workspaces($workspaceIds);

            if ($ownedIds !== []) {
                throw ValidationException::withMessages([
                    'user' => 'Transfer every owned workspace before deleting this user.',
                ]);
            }

            foreach ($current as $workspaceId => $role) {
                $this->rules->adminChangeIsSafe($workspaceId, $user->id, $role, null);
            }

            DB::table('team_user')->where('user_id', $user->id)->delete();
            DB::table('user_workspace')->where('user_id', $user->id)->delete();
        });
    }
}
