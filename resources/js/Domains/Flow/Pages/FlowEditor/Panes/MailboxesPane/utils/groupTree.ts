import type { MailboxWatcher } from '@/Domains/Mailbox/types';

export interface GroupTreeNode {
    label: string;
    fullPath: string;
    watchers: MailboxWatcher[];
    children: GroupTreeNode[];
}

export function buildGroupTree(watchers: MailboxWatcher[]): { ungrouped: MailboxWatcher[]; roots: GroupTreeNode[] } {
    const ungrouped: MailboxWatcher[] = [];
    const nodeMap = new Map<string, GroupTreeNode>();

    for (const watcher of watchers) {
        if (!watcher.group) {
            ungrouped.push(watcher);
            continue;
        }

        const parts = watcher.group.split('/');
        let currentPath = '';
        for (let index = 0; index < parts.length; index += 1) {
            const parentPath = currentPath;
            currentPath = currentPath ? `${currentPath}/${parts[index]}` : parts[index];
            if (!nodeMap.has(currentPath)) {
                const node = { label: parts[index], fullPath: currentPath, watchers: [], children: [] };
                nodeMap.set(currentPath, node);
                if (parentPath) {
                    nodeMap.get(parentPath)!.children.push(node);
                }
            }
        }
        nodeMap.get(watcher.group)!.watchers.push(watcher);
    }

    const roots: GroupTreeNode[] = [];
    for (const [path, node] of nodeMap) {
        if (!path.includes('/')) {
            roots.push(node);
        }
    }

    return { ungrouped, roots };
}
