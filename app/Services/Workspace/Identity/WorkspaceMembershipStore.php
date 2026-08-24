<?php

namespace App\Services\Workspace\Identity;

use App\Models\User;
use App\Models\WorkspaceInvitation;
use Illuminate\Support\Facades\DB;

final class WorkspaceMembershipStore
{
    public function role(string $workspaceId, string $userId): ?string
    {
        $role = DB::table('user_workspace')
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $userId)
            ->value('role');

        return is_string($role) ? $role : null;
    }

    public function insert(string $workspaceId, string $userId, string $role): void
    {
        DB::table('user_workspace')->insert([
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'role' => $role,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->deleteInvitation($workspaceId, $userId);
    }

    public function upsert(string $workspaceId, string $userId, string $role): void
    {
        DB::table('user_workspace')->upsert(
            [[
                'workspace_id' => $workspaceId,
                'user_id' => $userId,
                'role' => $role,
                'created_at' => now(),
                'updated_at' => now(),
            ]],
            ['workspace_id', 'user_id'],
            ['role', 'updated_at'],
        );
        $this->deleteInvitation($workspaceId, $userId);
    }

    public function updateRole(string $workspaceId, string $userId, string $role): void
    {
        DB::table('user_workspace')
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $userId)
            ->update(['role' => $role, 'updated_at' => now()]);
        $this->deleteInvitation($workspaceId, $userId);
    }

    public function delete(string $workspaceId, string $userId): void
    {
        $this->deleteTeamsForWorkspace($userId, $workspaceId);
        $this->deleteInvitation($workspaceId, $userId);
        DB::table('user_workspace')
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $userId)
            ->delete();
    }

    public function ensure(string $workspaceId, string $userId, ?string $role = null): void
    {
        $currentRole = $this->role($workspaceId, $userId);

        if ($currentRole === null) {
            $this->insert($workspaceId, $userId, $role ?? 'member');
        } elseif ($role !== null && $currentRole !== $role) {
            $this->updateRole($workspaceId, $userId, $role);
        } else {
            $this->deleteInvitation($workspaceId, $userId);
        }
    }

    public function insertTeam(string $teamId, string $workspaceId, string $userId): void
    {
        DB::table('team_user')->insertOrIgnore([
            'team_id' => $teamId,
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function deleteTeamsForWorkspace(string $userId, string $workspaceId): void
    {
        DB::table('team_user')
            ->where('user_id', $userId)
            ->where('workspace_id', $workspaceId)
            ->delete();
    }

    private function deleteInvitation(string $workspaceId, string $userId): void
    {
        $email = User::query()->whereKey($userId)->value('email');

        if (! is_string($email) || $email === '') {
            return;
        }

        WorkspaceInvitation::query()
            ->where('workspace_id', $workspaceId)
            ->whereRaw('LOWER(email) = LOWER(?)', [$email])
            ->delete();
    }
}
