import type { FolderTree } from '@/Domains/Folder/types';

export function countFlowsInTree(tree: FolderTree): number {
    let count = tree.flows.length;
    for (const child of tree.children) {
        count += countFlowsInTree(child);
    }
    return count;
}

export function findFolderInTree(tree: FolderTree[], id: Id): FolderTree | null {
    for (const folder of tree) {
        if (folder.id === id) return folder;
        const found = findFolderInTree(folder.children, id);
        if (found) return found;
    }
    return null;
}

export function countSubFolders(tree: FolderTree): number {
    let count = tree.children.length;
    for (const child of tree.children) {
        count += countSubFolders(child);
    }
    return count;
}
