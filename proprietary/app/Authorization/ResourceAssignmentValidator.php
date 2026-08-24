<?php

namespace App\Authorization;

use App\Models\Folder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ResourceAssignmentValidator
{
    public function validate(
        string $workspaceId,
        string $ownerId,
        string $scope,
        ?string $teamId = null,
        ?string $folderId = null,
        ?string $workspaceFolderId = null,
    ): void {
        $this->ensureWorkspaceMember($workspaceId, $ownerId);

        if ($scope === 'team') {
            $this->ensureTeamAssignment($workspaceId, $ownerId, $teamId);
        }

        if ($folderId !== null) {
            $this->ensurePersonalFolder($workspaceId, $ownerId, $scope, $folderId);
        }

        if ($workspaceFolderId !== null) {
            $this->ensureSharedFolder($workspaceId, $scope, $teamId, $workspaceFolderId);
        }
    }

    /**
     * Throwing variant of ownerSatisfiesScope. Unlike validate(), the team
     * scope does not require workspace membership so that instance admins
     * (who may not be workspace members) can hold team-scoped resources.
     */
    public function ensureOwnerSatisfiesScope(
        string $workspaceId,
        string $ownerId,
        string $scope,
        ?string $teamId = null,
    ): void {
        if ($scope === 'team') {
            $this->ensureTeamAssignment($workspaceId, $ownerId, $teamId);

            return;
        }

        $this->ensureWorkspaceMember($workspaceId, $ownerId);
    }

    /**
     * Boolean variant for callers that shape their own error responses.
     */
    public function ownerSatisfiesScope(
        string $workspaceId,
        string $ownerId,
        string $scope,
        ?string $teamId = null,
    ): bool {
        try {
            $this->ensureOwnerSatisfiesScope($workspaceId, $ownerId, $scope, $teamId);
        } catch (ValidationException) {
            return false;
        }

        return true;
    }

    private function ensureWorkspaceMember(string $workspaceId, string $ownerId): void
    {
        $isMember = DB::table('user_workspace')
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $ownerId)
            ->exists();

        if (! $isMember) {
            throw ValidationException::withMessages([
                'owner_id' => 'The owner must be a member of this workspace.',
            ]);
        }
    }

    private function ensureTeamAssignment(string $workspaceId, string $ownerId, ?string $teamId): void
    {
        if ($teamId === null) {
            throw ValidationException::withMessages([
                'team_id' => 'A team must be selected for team scope.',
            ]);
        }

        $teamInWorkspace = DB::table('workspace_teams')
            ->where('id', $teamId)
            ->where('workspace_id', $workspaceId)
            ->exists();

        if (! $teamInWorkspace) {
            throw ValidationException::withMessages([
                'team_id' => 'The selected team must belong to this workspace.',
            ]);
        }

        // Instance admins can assign any workspace team without being a member.
        if ($this->isInstanceAdmin($ownerId)) {
            return;
        }

        $isTeamMember = DB::table('team_user')
            ->where('team_id', $teamId)
            ->where('user_id', $ownerId)
            ->exists();

        if (! $isTeamMember) {
            throw ValidationException::withMessages([
                'team_id' => 'The selected team must belong to this workspace and include the owner.',
            ]);
        }
    }

    private function isInstanceAdmin(string $userId): bool
    {
        return DB::table('users')
            ->where('id', $userId)
            ->where('role', 'admin')
            ->exists();
    }

    private function ensurePersonalFolder(string $workspaceId, string $ownerId, string $scope, string $folderId): void
    {
        $isValid = $scope === 'owner'
            && Folder::whereKey($folderId)
                ->where('workspace_id', $workspaceId)
                ->where('owner_id', $ownerId)
                ->where('is_shared', false)
                ->whereNull('team_id')
                ->exists();

        if (! $isValid) {
            throw ValidationException::withMessages([
                'folder_id' => 'The selected folder must be a personal folder owned by the target owner in this workspace.',
            ]);
        }
    }

    private function ensureSharedFolder(string $workspaceId, string $scope, ?string $teamId, string $folderId): void
    {
        $query = Folder::whereKey($folderId)
            ->where('workspace_id', $workspaceId)
            ->where('is_shared', true);

        if ($scope === 'workspace') {
            $query->whereNull('team_id');
        } elseif ($scope === 'team' && $teamId !== null) {
            $query->where('team_id', $teamId);
        } else {
            $query->whereRaw('1 = 0');
        }

        if (! $query->exists()) {
            throw ValidationException::withMessages([
                'workspace_folder_id' => 'The selected folder must match the target workspace or team scope.',
            ]);
        }
    }
}
