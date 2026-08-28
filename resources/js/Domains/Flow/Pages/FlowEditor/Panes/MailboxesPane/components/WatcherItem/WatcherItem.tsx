import type React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Switch from '@/Shared/UI/Switch/Switch';
import AvatarSelectionToggle from '@/Shared/UI/AvatarSelectionToggle/AvatarSelectionToggle';
import type { MailboxWatcher } from '@/Domains/Mailbox/types';
import * as S from './styled';

interface WatcherItemProps {
    watcher: MailboxWatcher;
    canManage: boolean;
    overflowOpen: boolean;
    overflowRef?: React.Ref<HTMLDivElement>;
    mailboxAddress: string;
    selected: boolean;
    onToggleSelected: (watcherId: Id) => void;
    onEdit: (watcher: MailboxWatcher) => void;
    onToggleActive: (watcher: MailboxWatcher) => void;
    onToggleOverflow: (watcherId: Id) => void;
    onDuplicate: (watcher: MailboxWatcher) => void;
    onDelete: (watcher: MailboxWatcher) => void;
}

export default function WatcherItem({
    watcher,
    canManage,
    overflowOpen,
    overflowRef,
    mailboxAddress,
    selected,
    onToggleSelected,
    onEdit,
    onToggleActive,
    onToggleOverflow,
    onDuplicate,
    onDelete,
}: WatcherItemProps) {
    return (
        <S.WatcherItem>
            <S.WatcherItemHeader onClick={canManage ? () => onEdit(watcher) : undefined}>
                {canManage ? (
                    <AvatarSelectionToggle
                        selected={selected}
                        onChange={() => onToggleSelected(watcher.id)}
                        label={`${selected ? 'Deselect' : 'Select'} ${watcher.name}`}
                        size={20}
                    >
                        <S.WatcherItemIcon $active={watcher.is_active}>
                            <Icon icon="lucide:mail-search" />
                        </S.WatcherItemIcon>
                    </AvatarSelectionToggle>
                ) : (
                    <S.WatcherItemIcon $active={watcher.is_active}>
                        <Icon icon="lucide:mail-search" />
                    </S.WatcherItemIcon>
                )}
                <S.WatcherItemMeta>
                    <S.WatcherItemName>
                        {watcher.name}
                        {watcher.scope && watcher.scope !== 'owner' && (
                            <Icon icon={watcher.scope === 'team' ? 'lucide:users-round' : 'lucide:building-2'} width={12} style={{ color: '#3b82f6' }} />
                        )}
                    </S.WatcherItemName>
                    <S.WatcherItemInfo>
                        {mailboxAddress}
                        {' - '}{watcher.rules.length} rule{watcher.rules.length !== 1 ? 's' : ''}
                        {watcher.extract_enabled && ' - Parsing'}
                        {watcher.timeout != null && ` - ${watcher.timeout / 1000}s`}
                    </S.WatcherItemInfo>
                </S.WatcherItemMeta>
                {canManage && <S.WatcherItemActions onClick={event => event.stopPropagation()}>
                    <Switch
                        id={`watcher-active-${watcher.id}`}
                        checked={watcher.is_active}
                        onChange={() => onToggleActive(watcher)}
                    />
                    <S.OverflowWrap ref={overflowRef}>
                        <S.OverflowBtn type="button" onClick={() => onToggleOverflow(watcher.id)}>
                            <Icon icon="lucide:ellipsis-vertical" width={14} />
                        </S.OverflowBtn>
                        {overflowOpen && (
                            <S.OverflowMenu>
                                <S.OverflowMenuItem type="button" onClick={() => onDuplicate(watcher)}>
                                    <Icon icon="lucide:copy" width={13} /> Duplicate
                                </S.OverflowMenuItem>
                                <S.OverflowMenuItem type="button" $danger onClick={() => onDelete(watcher)}>
                                    <Icon icon="lucide:trash-2" width={13} /> Delete
                                </S.OverflowMenuItem>
                            </S.OverflowMenu>
                        )}
                    </S.OverflowWrap>
                </S.WatcherItemActions>}
            </S.WatcherItemHeader>
        </S.WatcherItem>
    );
}
