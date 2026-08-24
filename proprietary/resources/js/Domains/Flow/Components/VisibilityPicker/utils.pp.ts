import type { FolderTree } from '@/Domains/Folder/types';

export function findFolderName(
    tree: FolderTree[],
    id: Id,
): string | null {
    for (const folder of tree) {
        if (folder.id === id) {
            return folder.name;
        }

        const name = findFolderName(folder.children, id);
        if (name) {
            return name;
        }
    }

    return null;
}
