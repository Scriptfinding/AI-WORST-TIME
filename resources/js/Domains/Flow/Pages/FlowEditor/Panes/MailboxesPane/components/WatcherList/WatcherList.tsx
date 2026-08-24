import React from 'react';
import type { MailboxWatcher } from '@/Domains/Mailbox/types';
import WatcherItem from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/components/WatcherItem/WatcherItem';
import type { GroupTreeNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/utils/groupTree';
import WatcherTreeNode from './WatcherTreeNode';
import * as S from './styled';

interface WatcherListProps {
    ungrouped: MailboxWatcher[];
    roots: GroupTreeNode[];
    overflowId: Id | null;
    overflowRef: React.Ref<HTMLDivElement>;
    manageableIds: Set<Id>;
    selectedIds: Set<Id>;
    onToggleSelected: (watcherId: Id) => void;
    getMailboxAddress: (mailboxId: Id) => string;
    onEdit: (watcher: MailboxWatcher) => void;
    onToggleActive: (watcher: MailboxWatcher) => void;
    onToggleOverflow: (watcherId: Id) => void;
    onDuplicate: (watcher: MailboxWatcher) => void;
    onDelete: (watcher: MailboxWatcher) => void;
}

export default function WatcherList({
    ungrouped,
    roots,
    overflowId,
    overflowRef,
    manageableIds,
    selectedIds,
    onToggleSelected,
    getMailboxAddress,
    onEdit,
    onToggleActive,
    onToggleOverflow,
    onDuplicate,
    onDelete,
}: WatcherListProps) {
    return (
        <S.List>
            {ungrouped.map(watcher => (
                <WatcherItem
                    key={watcher.id}
                    watcher={watcher}
                    canManage={manageableIds.has(watcher.id)}
                    selected={selectedIds.has(watcher.id)}
                    onToggleSelected={onToggleSelected}
                    overflowOpen={overflowId === watcher.id}
                    overflowRef={overflowId === watcher.id ? overflowRef : undefined}
                    mailboxAddress={getMailboxAddress(watcher.mailbox_id)}
                    onEdit={onEdit}
                    onToggleActive={onToggleActive}
                    onToggleOverflow={onToggleOverflow}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                />
            ))}
            {roots.map(node => (
                <WatcherTreeNode
                    key={node.fullPath}
                    node={node}
                    manageableIds={manageableIds}
                    selectedIds={selectedIds}
                    onToggleSelected={onToggleSelected}
                    overflowId={overflowId}
                    overflowRef={overflowRef}
                    getMailboxAddress={getMailboxAddress}
                    onEdit={onEdit}
                    onToggleActive={onToggleActive}
                    onToggleOverflow={onToggleOverflow}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                />
            ))}
        </S.List>
    );
}
