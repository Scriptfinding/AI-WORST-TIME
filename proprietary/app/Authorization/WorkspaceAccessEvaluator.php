<?php

namespace App\Authorization;

use App\Models\Workspace;

/**
 * Per-request memo of workspace activity (existence and expiry). Policies
 * check this on every ability call; without the memo, pages looping can()
 * over flows or runs issue one workspaces query per item. Registered as a
 * scoped binding so the memo is flushed between requests and queue jobs.
 */
final class WorkspaceAccessEvaluator
{
    /** @var array<string, bool> */
    private array $active = [];

    public function isActive(string $workspaceId): bool
    {
        return $this->active[$workspaceId] ??= Workspace::query()
            ->whereKey($workspaceId)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->exists();
    }
}
