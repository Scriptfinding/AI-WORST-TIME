<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WorkspaceTeam;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

abstract class Controller
{
    use AuthorizesRequests;

    protected function workspaceIdFromSession(): string
    {
        $workspaceId = session('current_workspace_id');
        abort_unless(is_string($workspaceId) && $workspaceId !== '', 404);

        return $workspaceId;
    }

    /**
     * Resolves a workspace member ID for ownership transfer or uses the current user.
     * Rejects non-members and unauthorized ownership changes.
     *
     * @param  array<string, mixed>  $validated
     */
    protected function resolveOwnerId(
        array &$validated,
        string $workspaceId,
        string $fallbackUserId,
        string $idKey = 'user_id',
    ): string {
        if (! array_key_exists($idKey, $validated) || $validated[$idKey] === null) {
            unset($validated[$idKey]);

            return $fallbackUserId;
        }

        $targetValue = $validated[$idKey];
        abort_unless(is_string($targetValue), 422);
        $targetId = $targetValue;

        if ($targetId !== $fallbackUserId) {
            $this->authorizeOwnershipChange($workspaceId, $fallbackUserId);
        }

        $isMember = \App\Models\Workspace::where('id', $workspaceId)
            ->whereHas('users', fn ($q) => $q->where('users.id', $targetId))
            ->exists();

        if (! $isMember) {
            unset($validated[$idKey]);
            throw ValidationException::withMessages([
                $idKey => 'The selected user is not a member of this workspace.',
            ]);
        }

        $validated[$idKey] = $targetId;

        return $targetId;
    }

    /**
     * Verify that the current user is allowed to change ownership of a resource.
     */
    protected function authorizeOwnershipChange(string $workspaceId, string $currentOwnerId): void
    {
        $user = request()->user();
        abort_unless($user instanceof User, 401);
        $ownerRole = DB::table('user_workspace')
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $currentOwnerId)
            ->value('role');
        $ownerRole = is_string($ownerRole) ? $ownerRole : null;
        $context = app(\App\Authorization\AuthorizationContextFactory::class)
            ->for($user, $workspaceId);

        abort_unless(
            app(\App\Authorization\ScopeEvaluator::class)
                ->canTransferOwnership($context, $currentOwnerId, $ownerRole),
            403,
            'You are not authorized to change the ownership of this resource.',
        );
    }

    /**
     * Batch-resolve owner workspace roles for a collection of resources.
     * Useful for passing owner_workspace_role to the frontend so the UI
     * can determine whether to allow ownership/visibility changes.
     */
    /**
     * @param  iterable<array-key, Model|array<string, mixed>>  $items
     */
    protected function injectOwnerWorkspaceRoles(iterable $items, string $workspaceId, string $ownerKey = 'user_id'): void
    {
        $ownerIds = collect($items)->pluck($ownerKey)->filter()->unique()->values()->all();

        if (empty($ownerIds)) {
            return;
        }

        $roles = DB::table('user_workspace')
            ->where('workspace_id', $workspaceId)
            ->whereIn('user_id', $ownerIds)
            ->pluck('role', 'user_id')
            ->all();
        foreach ($items as $item) {
            $oid = is_array($item) ? ($item[$ownerKey] ?? null) : ($item->$ownerKey ?? null);
            $role = $oid ? ($roles[$oid] ?? 'member') : 'member';

            if (is_array($item)) {
                $item['owner_workspace_role'] = $role;
            } else {
                $item->setAttribute('owner_workspace_role', $role);
            }
        }
    }

    /**
     * Get the owner workspace role for a single resource.
     */
    protected function getOwnerWorkspaceRole(string $ownerId, string $workspaceId): string
    {
        $role = DB::table('user_workspace')
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $ownerId)
            ->value('role');

        return is_string($role) ? $role : 'member';
    }

    /**
     * Apply the ownership scope filter shared by scoped resource listings:
     * "user"/"mine", "workspace", "team", or "team:{id}".
     *
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     */
    protected function applyOwnershipScopeFilter(Builder $query, string $scopeFilter, string $workspaceId, string $userId): void
    {
        if (in_array($scopeFilter, ['user', 'mine'], true)) {
            $query->where('scope', 'user')->where('user_id', $userId);
        } elseif ($scopeFilter === 'workspace') {
            $query->where('scope', 'workspace');
        } elseif ($scopeFilter === 'team') {
            $query->where('scope', 'team');
        } elseif (str_starts_with($scopeFilter, 'team:')) {
            $query->where('scope', 'team')->where(
                'team_id',
                $this->resolveWorkspaceTeamId(substr($scopeFilter, 5), $workspaceId),
            );
        }
    }

    protected function resolveWorkspaceTeamId(?string $id, string $workspaceId): ?string
    {
        if ($id === null || $id === '') {
            return null;
        }

        $teamId = WorkspaceTeam::query()
            ->where('workspace_id', $workspaceId)
            ->where('id', $id)
            ->value('id');

        if (! is_string($teamId)) {
            throw ValidationException::withMessages([
                'team_id' => 'The selected team is invalid.',
            ]);
        }

        return $teamId;
    }

    protected function resolveWorkspaceFolderId(?string $id, string $workspaceId, string $key = 'folder_id'): ?string
    {
        if ($id === null || $id === '') {
            return null;
        }

        $folderId = \App\Models\Folder::query()
            ->where('workspace_id', $workspaceId)
            ->where('id', $id)
            ->value('id');

        if (! is_string($folderId)) {
            throw ValidationException::withMessages([
                $key => 'The selected folder is invalid.',
            ]);
        }

        return $folderId;
    }
}
