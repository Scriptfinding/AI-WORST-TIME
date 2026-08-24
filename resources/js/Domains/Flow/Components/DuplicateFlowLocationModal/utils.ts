import type { VisibilityPickerValue } from '@proprietary/Domains/Flow/Components/VisibilityPicker/VisibilityPicker.pp';
import type { Flow } from '@/Domains/Flow/types';
import type { TeamTree } from '@/Domains/Folder/types';

export type DuplicateFlow = Pick<Flow, 'id' | 'name' | 'visibility' | 'folder_id' | 'workspace_folder_id' | 'team_id'>;

export function getDuplicateLocationValue(flow: DuplicateFlow): VisibilityPickerValue {
    return {
        visibility: flow.visibility,
        personalFolderId: flow.visibility === 'owner' ? flow.folder_id : null,
        wsFolderId: flow.visibility === 'workspace' ? flow.workspace_folder_id : null,
        teamId: flow.visibility === 'team' ? flow.team_id : null,
        teamFolderId: flow.visibility === 'team' ? flow.workspace_folder_id : null,
    };
}

export function buildDuplicateLocationPayload(
    value: VisibilityPickerValue,
    teamTrees: TeamTree[],
): Record<string, unknown> {
    const payload: Record<string, unknown> = { visibility: value.visibility };

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
