import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { MailboxWatcher } from '@/Domains/Mailbox/types';
import WatcherItem from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/components/WatcherItem/WatcherItem';
import type { GroupTreeNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/utils/groupTree';
import * as S from './WatcherTreeNode.styled';

interface Props {
    depth?: number;
    getMailboxAddress: (mailboxId: Id) => string;
    manageableIds: Set<Id>;
    node: GroupTreeNode;
    selectedIds: Set<Id>;
    onToggleSelected: (watcherId: Id) => void;
    onDelete: (watcher: MailboxWatcher) => void;
    onDuplicate: (watcher: MailboxWatcher) => void;
    onEdit: (watcher: MailboxWatcher) => void;
    onToggleActive: (watcher: MailboxWatcher) => void;
    onToggleOverflow: (watcherId: Id) => void;
    overflowId: Id | null;
    overflowRef: React.Ref<HTMLDivElement>;
}

export default function WatcherTreeNode({ depth = 0, node, ...itemProps }: Props) {
    return (
        <>
            <S.TreeGroupLabel $depth={depth}>
                <Icon icon={depth === 0 ? 'lucide:folder' : 'lucide:corner-down-right'} width={12} />
                {node.label}
            </S.TreeGroupLabel>
            {node.watchers.map(watcher => (
                <WatcherItem
                    key={watcher.id}
                    watcher={watcher}
                    canManage={itemProps.manageableIds.has(watcher.id)}
                    selected={itemProps.selectedIds.has(watcher.id)}
                    onToggleSelected={itemProps.onToggleSelected}
                    overflowOpen={itemProps.overflowId === watcher.id}
                    overflowRef={itemProps.overflowId === watcher.id ? itemProps.overflowRef : undefined}
                    mailboxAddress={itemProps.getMailboxAddress(watcher.mailbox_id)}
                    onEdit={itemProps.onEdit}
                    onToggleActive={itemProps.onToggleActive}
                    onToggleOverflow={itemProps.onToggleOverflow}
                    onDuplicate={itemProps.onDuplicate}
                    onDelete={itemProps.onDelete}
                />
            ))}
            {node.children.map(child => (
                <WatcherTreeNode
                    key={child.fullPath}
                    {...itemProps}
                    node={child}
                    depth={depth + 1}
                />
            ))}
        </>
    );
}
