import type { Folder } from '@/Domains/Folder/types';

export type TargetScope = 'owner' | 'workspace' | 'team';

export interface FolderDropTarget {
    folderId: Id;
    scope: TargetScope;
    teamId: Id | null;
}

export function getFolderDropTarget(folder: Folder, isWorkspaceView = false): FolderDropTarget {
    if (folder.team_id) {
        return { folderId: folder.id, scope: 'team', teamId: folder.team_id };
    }

    return {
        folderId: folder.id,
        scope: folder.is_shared || isWorkspaceView ? 'workspace' : 'owner',
        teamId: null,
    };
}

export function isSameDropScope(flowScope: string, flowTeamId: Id, target: FolderDropTarget): boolean {
    if (flowScope !== target.scope) return false;
    return target.scope !== 'team'
        || (target.teamId !== null && String(flowTeamId) === String(target.teamId));
}

export function getFlowMovePayload(target: FolderDropTarget, changeVisibility: boolean) {
    const visibility = changeVisibility ? { change_visibility: true } : {};

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

export function scopeLabel(scope: string): string {
    return scope === 'team' ? 'Team' : scope === 'workspace' ? 'Workspace' : 'Owner';
}
