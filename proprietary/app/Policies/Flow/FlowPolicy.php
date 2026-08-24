<?php

/*
 * Portions of this file implement paid Puppetflow features (teams and
 * workspace sharing) and are licensed under the Puppetflow Proprietary
 * License. See LICENSE_PROPRIETARY.md.
 */

namespace App\Policies\Flow;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ScopeEvaluator;
use App\Authorization\WorkspaceAccessEvaluator;
use App\Models\Flow;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\DB;

class FlowPolicy
{
    public function __construct(
        private readonly AuthorizationContextFactory $contexts,
        private readonly ScopeEvaluator $scopes,
        private readonly WorkspaceAccessEvaluator $workspaceAccess,
    ) {}

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Flow $flow): bool
    {
        return $this->canAccessWorkspace($user, $flow)
            && $this->scopes->canView(
                $this->contexts->forCurrentOr($user, $flow->workspace_id),
                $flow->workspace_id,
                $flow->owner_id,
                $flow->visibility,
                $flow->team_id,
            );
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Flow $flow): bool
    {
        return $this->canAccessWorkspace($user, $flow)
            && $this->scopes->canManage(
                $this->contexts->forCurrentOr($user, $flow->workspace_id),
                $flow->workspace_id,
                $flow->owner_id,
            );
    }

    public function delete(User $user, Flow $flow): bool
    {
        return $this->update($user, $flow);
    }

    public function manageScope(User $user, Flow $flow): bool
    {
        return $this->update($user, $flow);
    }

    public function transferOwnership(User $user, Flow $flow): bool
    {
        if (! $this->canAccessWorkspace($user, $flow)) {
            return false;
        }

        $context = $this->contexts->forCurrentOr($user, $flow->workspace_id);
        $ownerRole = DB::table('user_workspace')
            ->where('workspace_id', $flow->workspace_id)
            ->where('user_id', $flow->owner_id)
            ->value('role');
        $ownerRole = is_string($ownerRole) ? $ownerRole : null;

        return $this->scopes->canEnterWorkspace($context, $flow->workspace_id)
            && $this->scopes->canTransferOwnership($context, $flow->owner_id, $ownerRole);
    }

    public function execute(User $user, Flow $flow): bool
    {
        return $this->canAccessWorkspace($user, $flow)
            && $this->scopes->canView(
                $this->contexts->for($user, $flow->workspace_id),
                $flow->workspace_id,
                $flow->owner_id,
                $flow->visibility,
                $flow->team_id,
            );
    }

    public function executeAutomated(User $user, Flow $flow): Response
    {
        if (! $this->execute($user, $flow)) {
            return Response::deny();
        }

        return $flow->is_published
            ? Response::allow()
            : Response::denyWithStatus(422, 'This flow is unpublished and cannot be run automatically.');
    }

    public function viewRuns(User $user, Flow $flow): bool
    {
        return $this->update($user, $flow);
    }

    private function canAccessWorkspace(User $user, Flow $flow): bool
    {
        return $user->isAdmin() || $this->workspaceAccess->isActive($flow->workspace_id);
    }
}
