/**
 * Determine whether the current user can edit ownership & visibility
 * of a resource owned by `ownerWorkspaceRole`.
 *
 * Rules:
 *  - The resource owner can always edit ownership/visibility.
 *  - An admin (workspace_role === 'admin') can always edit.
 *  - A manager can edit only if the resource owner does NOT have a higher rank (admin).
 *  - Members should not reach these modals at all (already hidden).
 */

export type WorkspaceRole = 'admin' | 'manager' | 'member';

interface CanEditOwnershipParams {
    /** Current user's ID */
    currentUserId: Id;
    /** Current user's workspace role */
    currentUserWorkspaceRole: WorkspaceRole;
    /** The resource owner's ID */
    resourceOwnerId: Id | null;
    /** The resource owner's workspace role (from backend) */
    ownerWorkspaceRole?: WorkspaceRole;
}

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
    member: 0,
    manager: 1,
    admin: 2,
};

export function canEditOwnership({
    currentUserId,
    currentUserWorkspaceRole,
    resourceOwnerId,
    ownerWorkspaceRole,
}: CanEditOwnershipParams): boolean {
    // Owner can always edit their own resources
    if (resourceOwnerId === currentUserId) {
        return true;
    }

    // Admin can always edit
    if (currentUserWorkspaceRole === 'admin') {
        return true;
    }

    // Manager can edit only if the resource owner doesn't outrank them
    if (currentUserWorkspaceRole === 'manager') {
        const ownerLevel = ROLE_HIERARCHY[ownerWorkspaceRole ?? 'member'];
        const currentLevel = ROLE_HIERARCHY[currentUserWorkspaceRole];
        return currentLevel >= ownerLevel;
    }

    // Members cannot edit
    return false;
}

export const OWNERSHIP_DISABLED_HINT = 'Only an admin or the resource owner can change ownership and visibility.';

export const ADMIN_TRANSFER_WARNING = 'By transferring it to an admin, you will lose ownership and visibility management for it.';
