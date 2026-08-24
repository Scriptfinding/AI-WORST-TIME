import type { VisibilityPickerValue } from '@proprietary/Domains/Flow/Components/VisibilityPicker/VisibilityPicker.pp';
import type { Flow } from '@/Domains/Flow/types';
import type { TeamTree } from '@/Domains/Folder/types';

export type MoveFlow = Pick<Flow, 'id' | 'visibility' | 'folder_id' | 'workspace_folder_id' | 'owner_id' | 'team_id'>;

export function getMoveLocationValue(flow: MoveFlow): VisibilityPickerValue {
    return {
        visibility: flow.visibility,
        personalFolderId: flow.visibility === 'owner' ? flow.folder_id : null,
        wsFolderId: flow.visibility === 'workspace' ? flow.workspace_folder_id : null,
        teamId: flow.visibility === 'team' ? flow.team_id : null,
        teamFolderId: flow.visibility === 'team' ? flow.workspace_folder_id : null,
    };
}

export function buildMoveLocationPayload(
    value: VisibilityPickerValue,
    teamTrees: TeamTree[],
): Record<string, Id | boolean | null> {
    const payload: Record<string, Id | boolean | null> = {
        scope: value.visibility,
        change_visibility: true,
    };

    if (value.visibility === 'owner') {
        payload.folder_id = value.personalFolderId;
    } else if (value.visibility === 'workspace') {
        payload.workspace_folder_id = value.wsFolderId;
    } else {
        const selectedTeam = teamTrees.find(team => team.id === value.teamId);
        payload.team_id = value.teamId;
        payload.workspace_folder_id = value.teamFolderId ?? selectedTeam?.root_folder_id ?? null;
    }

    return payload;
}
