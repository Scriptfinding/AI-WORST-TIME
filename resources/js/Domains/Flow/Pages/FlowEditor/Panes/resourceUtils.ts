export const SCOPE_ICONS: Record<string, string> = {
    owner: 'lucide:user',
    workspace: 'lucide:building-2',
    team: 'lucide:users-round',
};

interface GroupedResource {
    group: string | null;
}

interface LabelledResource {
    label: string;
}

interface ScopedResource {
    scope: string;
    team?: { name: string } | null;
}

export interface GroupTreeNode<T> {
    label: string;
    fullPath: string;
    items: T[];
    children: GroupTreeNode<T>[];
}

export function buildGroupTree<T extends GroupedResource>(
    items: T[],
): { ungrouped: T[]; roots: GroupTreeNode<T>[] } {
    const ungrouped: T[] = [];
    const nodeMap = new Map<string, GroupTreeNode<T>>();

    for (const item of items) {
        if (!item.group) {
            ungrouped.push(item);
            continue;
        }

        const parts = item.group.split('/');
        let currentPath = '';
        for (const part of parts) {
            const parentPath = currentPath;
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            if (!nodeMap.has(currentPath)) {
                const node: GroupTreeNode<T> = {
                    label: part,
                    fullPath: currentPath,
                    items: [],
                    children: [],
                };
                nodeMap.set(currentPath, node);
                if (parentPath) nodeMap.get(parentPath)!.children.push(node);
            }
        }
        nodeMap.get(item.group)!.items.push(item);
    }

    const roots = [...nodeMap.entries()]
        .filter(([path]) => !path.includes('/'))
        .map(([, node]) => node);

    return { ungrouped, roots };
}

export function collectGroups<T extends GroupedResource>(groups: string[], items: T[]): string[] {
    const allGroups = new Set(groups);
    items.forEach(item => {
        if (item.group) allGroups.add(item.group);
    });
    return [...allGroups].sort();
}

export function createDuplicateLabel<T extends LabelledResource>(label: string, items: T[]): string {
    const baseName = label.replace(/ \(copy\d*\)$/, '');
    const existing = items.map(item => item.label);
    let copyName = `${baseName} (copy)`;
    let index = 2;

    while (existing.includes(copyName)) {
        copyName = `${baseName} (copy${index++})`;
    }

    return copyName;
}

export function getScopeLabel(resource: ScopedResource): string | null {
    if (resource.scope === 'team' && resource.team?.name) return resource.team.name;
    if (resource.scope === 'workspace') return 'Workspace';
    return null;
}
