import type { Breadcrumb, Folder, FolderTree } from '@/Domains/Folder/types';
import type { DropTarget } from './types';

export function resolveDropScope(
    folderId: Id | null,
    isWorkspace: boolean,
    breadcrumbs: Breadcrumb[],
    currentFolder: Folder | null,
): DropTarget {
    if (folderId === null) {
        return { folderId: null, scope: isWorkspace ? 'workspace' : 'owner', teamId: null };
    }

    const breadcrumb = breadcrumbs.find(item => item.id === folderId);
    if (breadcrumb) {
        if (breadcrumb.team_id) return { folderId, scope: 'team', teamId: breadcrumb.team_id };
        if (breadcrumb.is_shared || isWorkspace) return { folderId, scope: 'workspace', teamId: null };
        return { folderId, scope: 'owner', teamId: null };
    }

    if (currentFolder?.id === folderId) {
        if (currentFolder.team_id) return { folderId, scope: 'team', teamId: currentFolder.team_id };
        if (currentFolder.is_shared || isWorkspace) return { folderId, scope: 'workspace', teamId: null };
        return { folderId, scope: 'owner', teamId: null };
    }

    return { folderId, scope: isWorkspace ? 'workspace' : 'owner', teamId: null };
}

export function isSameDropScope(flowScope: string, flowTeamId: Id, target: DropTarget): boolean {
    if (flowScope !== target.scope) return false;
    return target.scope !== 'team'
        || (target.teamId !== null && String(flowTeamId) === String(target.teamId));
}

export function scopeLabel(scope: string): string {
    return scope === 'team' ? 'Team' : scope === 'workspace' ? 'Workspace' : 'Owner';
}

export function findFolderNode(trees: FolderTree[], id: Id): FolderTree | null {
    for (const folder of trees) {
        if (folder.id === id) return folder;

        const found = findFolderNode(folder.children, id);
        if (found) return found;
    }

    return null;
}

export function countFolderDescendants(folder: FolderTree): { folders: number; flows: number } {
    return folder.children.reduce(
        (acc, child) => {
            const childCounts = countFolderDescendants(child);
            return {
                folders: acc.folders + 1 + childCounts.folders,
                flows: acc.flows + child.flows.length + childCounts.flows,
            };
        },
        { folders: 0, flows: folder.flows.length },
    );
}

export function getFolderUrl(folderId: Id, isWorkspaceView: boolean): string {
    return isWorkspaceView
        ? `/flows?folder_id=${folderId}&view=workspace`
        : `/flows?folder_id=${folderId}`;
}

export function getParentUrl(parentFolderId: Id | null, isWorkspaceView: boolean, ownerId: Id | null = null): string {
    if (isWorkspaceView) {
        return parentFolderId
            ? `/flows?folder_id=${parentFolderId}&view=workspace`
            : '/flows?view=workspace';
    }

    if (parentFolderId) return `/flows?folder_id=${parentFolderId}`;

    return ownerId ? `/flows?owner_id=${ownerId}` : '/flows';
}

export function toggleSetValue<T>(values: Set<T>, value: T): Set<T> {
    const next = new Set(values);
    if (next.has(value)) {
        next.delete(value);
    } else {
        next.add(value);
    }
    return next;
}

export function getDefaultFolderTree(folder: Folder): FolderTree {
    return {
        id: folder.id,
        name: folder.name,
        parent_id: folder.parent_id,
        team_id: folder.team_id,
        children: [],
        flows: [],
    };
}

export function getMovePayload(target: DropTarget, changeVisibility: boolean): Record<string, Id | boolean | null> {
    const visibility: Record<string, boolean> = changeVisibility ? { change_visibility: true } : {};

    if (target.scope === 'team') {
        return {
            workspace_folder_id: target.folderId,
            scope: 'team',
            team_id: target.teamId,
            ...visibility,
        };
    }

    if (target.scope === 'workspace') {
        return {
            workspace_folder_id: target.folderId,
            scope: 'workspace',
            ...visibility,
        };
    }

    return {
        folder_id: target.folderId,
        ...visibility,
    };
}
