<?php

namespace App\Services\Workspace\Identity;

use App\Models\Workspace;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class WorkspaceIdentityRules
{
    private const ROLES = ['admin', 'manager', 'member'];

    public function role(string $role): string
    {
        if (! in_array($role, self::ROLES, true)) {
            throw ValidationException::withMessages([
                'role' => 'The role must be admin, manager, or member.',
            ]);
        }

        return $role;
    }

    public function ownerRemainsAdmin(Workspace $workspace, string $userId, ?string $nextRole): void
    {
        if ($workspace->owner_id === $userId && $nextRole !== 'admin') {
            throw ValidationException::withMessages([
                'role' => 'A workspace owner must remain an administrator.',
            ]);
        }
    }

    public function adminChangeIsSafe(
        string $workspaceId,
        string $userId,
        ?string $currentRole,
        ?string $nextRole,
    ): void {
        if ($currentRole !== 'admin' || $nextRole === 'admin') {
            return;
        }

        $otherAdminExists = DB::table('user_workspace')
            ->where('workspace_id', $workspaceId)
            ->where('user_id', '!=', $userId)
            ->where('role', 'admin')
            ->exists();

        if (! $otherAdminExists) {
            throw ValidationException::withMessages([
                'role' => 'Cannot remove or demote the last workspace administrator.',
            ]);
        }
    }

    /**
     * @param  list<string>  $ids
     * @return list<string>
     */
    public function ids(array $ids): array
    {
        $ids = array_values(array_unique($ids));
        sort($ids);

        return $ids;
    }

    /**
     * @param  array<string, string>  $memberships
     * @return array<string, string>
     */
    public function memberships(array $memberships): array
    {
        $normalized = [];

        foreach ($memberships as $workspaceId => $role) {
            if ($workspaceId === '') {
                throw ValidationException::withMessages([
                    'workspaces' => 'Workspace memberships must be keyed by workspace ID.',
                ]);
            }

            $normalized[$workspaceId] = $this->role($role);
        }

        ksort($normalized);

        return $normalized;
    }
}
