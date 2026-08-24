<?php

/*
 * Portions of this file implement paid Puppetflow features (teams and
 * workspace sharing) and are licensed under the Puppetflow Proprietary
 * License. See LICENSE_PROPRIETARY.md.
 */

namespace App\Policies\Folder;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ScopeEvaluator;
use App\Models\Folder;
use App\Models\User;
use App\Models\Workspace;

class FolderPolicy
{
    public function __construct(
        private readonly AuthorizationContextFactory $contexts,
        private readonly ScopeEvaluator $scopes,
    ) {}

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Folder $folder): bool
    {
        return $this->scopes->canView(
            $this->contexts->forCurrentOr($user, $folder->workspace_id),
            $folder->workspace_id,
            $folder->owner_id,
            $this->scope($folder),
            $folder->team_id,
        );
    }

    public function create(User $user, Workspace $workspace): bool
    {
        return $this->scopes->canEnterWorkspace(
            $this->contexts->for($user, $workspace->id),
            $workspace->id,
        );
    }

    public function update(User $user, Folder $folder): bool
    {
        return $this->scopes->canManage(
            $this->contexts->forCurrentOr($user, $folder->workspace_id),
            $folder->workspace_id,
            $folder->owner_id,
        );
    }

    public function delete(User $user, Folder $folder): bool
    {
        return $this->update($user, $folder);
    }

    private function scope(Folder $folder): string
    {
        if (! $folder->is_shared) {
            return 'owner';
        }

        return $folder->team_id === null ? 'workspace' : 'team';
    }
}
