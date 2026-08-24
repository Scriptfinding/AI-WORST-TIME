import type { Flow } from '@/Domains/Flow/types';
import type { FolderTree, TeamTree, UserTree } from '@/Domains/Folder/types';

export type FlowCardVariant = 'grid' | 'list';

export interface FlowCardProps {
    flow: Flow;
    variant?: FlowCardVariant;
    workspaceTree?: FolderTree[];
    personalTree?: FolderTree[];
    teamTrees?: TeamTree[];
    /** Other users' personal trees, used to scope move targets to the flow owner. */
    userTrees?: UserTree[];
    selectionActive?: boolean;
    selected?: boolean;
    onToggleSelect?: (flow: Flow) => void;
}

export interface FlowVisibilityData {
    visibility: 'owner' | 'workspace' | 'team';
    folder_id: Id | null;
    workspace_folder_id: Id | null;
    team_id?: Id | null;
    owner_id?: Id | null;
}
