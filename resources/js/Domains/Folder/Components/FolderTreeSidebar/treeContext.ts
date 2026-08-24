import { createContext, useContext } from 'react';
import type { DeletableFolder } from '@/Domains/Folder/types';
import type { SidebarFlow } from './types';

export interface FolderTreeContextValue {
    expandedFolders: Set<Id>;
    currentFolderId: Id | null;
    toggleFolder: (id: Id) => void;
    renameFolder: (folder: { id: Id; name: string }) => void;
    deleteFolder: (folder: DeletableFolder) => void;
    duplicateFlow: (flow: SidebarFlow) => void;
    moveFlow: (flow: SidebarFlow) => void;
    deleteFlow: (flow: SidebarFlow) => void;
    visibilityFlow?: (flow: SidebarFlow) => void;
    canEditFlow: (flow: SidebarFlow) => boolean;
}

export const FolderTreeContext = createContext<FolderTreeContextValue | null>(null);

// Gives folder-tree descendants access to shared navigation and flow actions.
export function useFolderTreeContext() {
    const context = useContext(FolderTreeContext);
    if (!context) {
        throw new Error('Folder tree components must be rendered inside FolderTreeContext.');
    }
    return context;
}
