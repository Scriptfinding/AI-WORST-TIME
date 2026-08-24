import type { Breadcrumb, Folder } from '@/Domains/Folder/types';

export type TargetScope = 'owner' | 'workspace' | 'team';

export interface DropTarget {
    folderId: Id | null;
    scope: TargetScope;
    teamId: Id | null;
}

export interface PendingMove {
    flowId: Id;
    target: DropTarget;
    fromScope: string;
}

export interface ExplorerFilters {
    search: string | null;
    folder_id: Id | null;
    view: string | null;
    owner_id: Id | null;
    search_everywhere: string | null;
}

export interface DropContext {
    isWorkspaceView: boolean;
    breadcrumbs: Breadcrumb[];
    currentFolder: Folder | null;
}
