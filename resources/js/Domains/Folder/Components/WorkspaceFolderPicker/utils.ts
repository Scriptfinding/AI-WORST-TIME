import type { FolderTree } from '@/Domains/Folder/types';

export function insertIntoTree(
    tree: FolderTree[],
    parentId: Id,
    node: FolderTree,
): FolderTree[] {
    return tree.map(folder => {
        if (folder.id === parentId) {
            return { ...folder, children: [...folder.children, node] };
        }

        if (folder.children.length > 0) {
            return {
                ...folder,
                children: insertIntoTree(folder.children, parentId, node),
            };
        }

        return folder;
    });
}

export function findName(tree: FolderTree[], id: Id): string | null {
    for (const folder of tree) {
        if (folder.id === id) {
            return folder.name;
        }

        const name = findName(folder.children, id);
        if (name) {
            return name;
        }
    }

    return null;
}
