<?php

namespace App\Services\Workspace;

use App\Enums\Authorization\Ability;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceTeam;
use App\Services\Workspace\Identity\IdentityRows;
use App\Services\Workspace\Identity\IdentityTransaction;
use App\Services\Workspace\Identity\WorkspaceIdentityRules;
use App\Services\Workspace\Identity\WorkspaceMembershipStore;
use App\Services\Workspace\Identity\WorkspaceMutationAuthorizer;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

final class WorkspaceTeamMembershipManager
{
    public function __construct(
        private readonly IdentityTransaction $transactions,
        private readonly IdentityRows $rows,
        private readonly WorkspaceMembershipStore $store,
        private readonly WorkspaceIdentityRules $rules,
        private readonly WorkspaceMutationAuthorizer $authorizer,
    ) {}

    /** @param list<string> $userIds */
    public function addMembers(
        WorkspaceTeam $team,
        array $userIds,
        ?string $workspaceRole = null,
        ?User $actor = null,
    ): void {
        $this->mutateMembers($team, $userIds, $workspaceRole, $actor, false);
    }

    /** @param list<string> $userIds */
    public function replaceMembers(
        WorkspaceTeam $team,
        array $userIds,
        ?string $workspaceRole = null,
        ?User $actor = null,
    ): void {
        $this->mutateMembers($team, $userIds, $workspaceRole, $actor, true);
    }

    /** @param list<string> $teamIds */
    public function replaceUserTeams(
        User $user,
        array $teamIds,
        ?string $workspaceRole = null,
        ?User $actor = null,
    ): void {
        $this->transactions->run(function () use ($user, $teamIds, $workspaceRole, $actor): void {
            $teamIds = $this->rules->ids($teamIds);
            $workspaceRole = $workspaceRole === null ? null : $this->rules->role($workspaceRole);
            $lockedUsers = $this->rows->users([$actor?->id, $user->id])->keyBy('id');
            /** @var User|null $lockedActor */
            $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
            $teams = WorkspaceTeam::query()->whereIn('id', $teamIds)->get(['id', 'workspace_id']);

            if ($teams->count() !== count($teamIds)) {
                throw (new ModelNotFoundException)->setModel(WorkspaceTeam::class, $teamIds);
            }

            $currentTeams = DB::table('team_user')
                ->where('user_id', $user->id)
                ->get(['team_id', 'workspace_id']);
            $rawWorkspaceIds = $teams->pluck('workspace_id')
                ->merge($currentTeams->pluck('workspace_id'))
                ->filter(fn (mixed $id): bool => is_string($id) && $id !== '')
                ->values()
                ->all();
            /** @var list<string> $rawWorkspaceIds */
            $workspaceIds = $this->rules->ids($rawWorkspaceIds);
            $lockedWorkspaces = $this->rows->workspaces($workspaceIds)->keyBy('id');

            foreach ($lockedWorkspaces as $lockedWorkspace) {
                $currentRole = $this->store->role($lockedWorkspace->id, $user->id);
                $this->authorizer->membership(
                    $lockedActor,
                    $lockedWorkspace,
                    $workspaceRole,
                    $currentRole,
                );
            }

            $lockedTeams = WorkspaceTeam::query()
                ->whereIn('id', $teamIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get(['id', 'workspace_id']);

            if ($lockedTeams->count() !== count($teamIds)) {
                throw (new ModelNotFoundException)->setModel(WorkspaceTeam::class, $teamIds);
            }

            foreach ($lockedTeams as $lockedTeam) {
                /** @var Workspace $lockedWorkspace */
                $lockedWorkspace = $lockedWorkspaces->get($lockedTeam->workspace_id);
                $this->ensureMembership($lockedWorkspace, $user->id, $workspaceRole);
                $this->store->insertTeam($lockedTeam->id, $lockedWorkspace->id, $user->id);
            }

            $currentTeamIds = $currentTeams->pluck('team_id')
                ->filter(fn (mixed $id): bool => is_string($id) && $id !== '')
                ->values()
                ->all();
            $removedIds = array_values(array_diff($currentTeamIds, $teamIds));

            if ($removedIds !== []) {
                DB::table('team_user')
                    ->where('user_id', $user->id)
                    ->whereIn('team_id', $removedIds)
                    ->delete();
            }
        });
    }

    /** @param list<string> $teamIds */
    public function replaceUserTeamsForWorkspace(
        Workspace $workspace,
        User $user,
        array $teamIds,
        ?string $workspaceRole = null,
        ?User $actor = null,
    ): void {
        $this->transactions->run(function () use (
            $workspace,
            $user,
            $teamIds,
            $workspaceRole,
            $actor,
        ): void {
            $teamIds = $this->rules->ids($teamIds);
            $workspaceRole = $workspaceRole === null ? null : $this->rules->role($workspaceRole);
            $lockedUsers = $this->rows->users([$actor?->id, $user->id])->keyBy('id');
            $lockedWorkspace = $this->rows->workspaces([$workspace->id])->firstOrFail();
            /** @var User|null $lockedActor */
            $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
            $currentRole = $this->store->role($lockedWorkspace->id, $user->id);
            $this->authorizer->membership(
                $lockedActor,
                $lockedWorkspace,
                $workspaceRole,
                $workspaceRole === null ? null : $currentRole,
            );
            $lockedTeams = WorkspaceTeam::query()
                ->whereIn('id', $teamIds)
                ->where('workspace_id', $lockedWorkspace->id)
                ->orderBy('id')
                ->lockForUpdate()
                ->get(['id', 'workspace_id']);

            if ($lockedTeams->count() !== count($teamIds)) {
                throw (new ModelNotFoundException)->setModel(WorkspaceTeam::class, $teamIds);
            }

            if ($teamIds !== [] || $workspaceRole !== null) {
                $this->ensureMembership($lockedWorkspace, $user->id, $workspaceRole);
            }

            DB::table('team_user')
                ->where('workspace_id', $lockedWorkspace->id)
                ->where('user_id', $user->id)
                ->delete();

            foreach ($lockedTeams as $lockedTeam) {
                $this->store->insertTeam($lockedTeam->id, $lockedWorkspace->id, $user->id);
            }
        });
    }

    /** @param list<string> $userIds */
    private function mutateMembers(
        WorkspaceTeam $team,
        array $userIds,
        ?string $workspaceRole,
        ?User $actor,
        bool $replace,
    ): void {
        $this->transactions->run(function () use (
            $team,
            $userIds,
            $workspaceRole,
            $actor,
            $replace,
        ): void {
            $userIds = $this->rules->ids($userIds);
            $workspaceRole = $workspaceRole === null ? null : $this->rules->role($workspaceRole);
            $lockedUsers = $this->rows->users([$actor?->id, ...$userIds])->keyBy('id');

            $foundUserIds = $lockedUsers->keys()->filter(fn ($id): bool => is_string($id))->values()->all();
            if (array_diff($userIds, $foundUserIds) !== []) {
                throw (new ModelNotFoundException)->setModel(User::class, $userIds);
            }

            $lockedWorkspace = $this->rows->workspaces([$team->workspace_id])->firstOrFail();
            $lockedTeam = WorkspaceTeam::query()
                ->whereKey($team->id)
                ->where('workspace_id', $lockedWorkspace->id)
                ->lockForUpdate()
                ->firstOrFail();
            $currentUserIds = DB::table('team_user')
                ->where('team_id', $lockedTeam->id)
                ->pluck('user_id')
                ->filter(fn (mixed $id): bool => is_string($id) && $id !== '')
                ->values()
                ->all();
            $affectedUserIds = $replace
                ? array_values(array_unique([
                    ...array_diff($userIds, $currentUserIds),
                    ...array_diff($currentUserIds, $userIds),
                ]))
                : array_values(array_diff($userIds, $currentUserIds));
            $rolesByUserId = DB::table('user_workspace')
                ->where('workspace_id', $lockedWorkspace->id)
                ->whereIn('user_id', $affectedUserIds)
                ->pluck('role', 'user_id');
            $affectedRoles = array_map(
                fn (string $userId): ?string => is_string($rolesByUserId->get($userId))
                    ? $rolesByUserId->get($userId)
                    : null,
                $affectedUserIds,
            );
            /** @var User|null $lockedActor */
            $lockedActor = $actor === null ? null : $lockedUsers->get($actor->id);
            $this->authorizer->teamMembership(
                $lockedActor,
                $lockedWorkspace,
                $lockedTeam,
                $workspaceRole,
                $affectedRoles,
            );
            $currentRoles = DB::table('user_workspace')
                ->where('workspace_id', $lockedWorkspace->id)
                ->whereIn('user_id', $userIds)
                ->pluck('role');
            if ($workspaceRole !== null && $currentRoles->contains('admin')) {
                $this->authorizer->workspace($lockedActor, Ability::UPDATE, $lockedWorkspace);
            }

            foreach ($userIds as $userId) {
                $this->ensureMembership($lockedWorkspace, $userId, $workspaceRole);
                $this->store->insertTeam($lockedTeam->id, $lockedWorkspace->id, $userId);
            }

            if ($replace) {
                $query = DB::table('team_user')->where('team_id', $lockedTeam->id);
                $userIds === []
                    ? $query->delete()
                    : $query->whereNotIn('user_id', $userIds)->delete();
            }
        });
    }

    private function ensureMembership(Workspace $workspace, string $userId, ?string $role): void
    {
        $currentRole = $this->store->role($workspace->id, $userId);

        if ($currentRole !== null && $role !== null && $currentRole !== $role) {
            $this->rules->ownerRemainsAdmin($workspace, $userId, $role);
            $this->rules->adminChangeIsSafe($workspace->id, $userId, $currentRole, $role);
        }

        $this->store->ensure($workspace->id, $userId, $role);
    }
}
