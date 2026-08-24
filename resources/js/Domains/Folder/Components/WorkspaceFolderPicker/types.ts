import type { FolderTree } from '@/Domains/Folder/types';

export type FolderScope = 'owner' | 'workspace' | 'team';
/** Folder ID, the 'root' sentinel, or null when nothing is selected. */
export type FolderSelection = Id | null;

export interface WorkspaceFolderPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (folderId: Id | null, folderName?: string | null) => void;
    workspaceTree: FolderTree[];
    loading?: boolean;
    title?: string;
    confirmLabel?: string;
    rootLabel?: string;
    rootIcon?: string;
    scope?: FolderScope;
    rootFolderId?: Id | null;
    /** In owner scope, folders created inline are assigned to this user. */
    ownerId?: Id | null;
}
