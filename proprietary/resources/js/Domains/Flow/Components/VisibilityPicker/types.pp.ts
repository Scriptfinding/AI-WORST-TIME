import type { FolderTree, TeamTree } from '@/Domains/Folder/types';

export type Visibility = 'owner' | 'workspace' | 'team';
export type FolderTarget = Visibility | null;

export interface VisibilityPickerValue {
    visibility: Visibility;
    personalFolderId: Id | null;
    wsFolderId: Id | null;
    teamId: Id | null;
    teamFolderId: Id | null;
}

export interface VisibilityPickerProps {
    value: VisibilityPickerValue;
    onChange: (value: VisibilityPickerValue) => void;
    personalTree: FolderTree[];
    workspaceTree: FolderTree[];
    teamTrees: TeamTree[];
    /** Owner of the flow; personal folders created from the picker belong to this user. */
    ownerId?: Id | null;
    ownerChanged?: boolean;
    disabled?: boolean;
    disabledHint?: string;
}
