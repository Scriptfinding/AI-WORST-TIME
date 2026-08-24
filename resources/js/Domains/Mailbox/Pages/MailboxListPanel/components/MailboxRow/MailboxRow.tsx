import type { MouseEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import AvatarSelectionToggle from '@/Shared/UI/AvatarSelectionToggle/AvatarSelectionToggle';
import type { MailboxItem } from '@/Domains/Mailbox/types';
import * as S from './styled';

interface Props {
    active: boolean;
    depth?: number;
    isAdmin: boolean;
    mailbox: MailboxItem;
    userId?: Id;
    selected: boolean;
    onToggleSelected: (mailboxId: Id) => void;
    onDelete: (mailbox: MailboxItem) => void;
    onEdit: (mailbox: MailboxItem) => void;
    onSelect: (mailbox: MailboxItem) => void;
}

export default function MailboxRow({
    active,
    depth = 0,
    isAdmin,
    mailbox,
    userId,
    selected,
    onToggleSelected,
    onDelete,
    onEdit,
    onSelect,
}: Props) {
    const scopeLabel = mailbox.scope === 'workspace'
        ? 'Workspace'
        : mailbox.scope === 'team'
            ? `Team: ${mailbox.team_name || '-'}`
            : 'Personal';
    const scopeIcon = mailbox.scope === 'workspace'
        ? 'lucide:building-2'
        : mailbox.scope === 'team'
            ? 'lucide:users-round'
            : 'lucide:user';
    const canManage = isAdmin || mailbox.user_id === userId;
    const stopAndRun = (
        event: MouseEvent,
        callback: (selectedMailbox: MailboxItem) => void,
    ) => {
        event.stopPropagation();
        callback(mailbox);
    };

    return (
        <S.Row $active={active} $depth={depth} onClick={() => onSelect(mailbox)}>
            {canManage ? (
                <AvatarSelectionToggle
                    selected={selected}
                    onChange={() => onToggleSelected(mailbox.id)}
                    label={`${selected ? 'Deselect' : 'Select'} ${mailbox.address}`}
                    size={22}
                >
                    <S.ScopeIcon
                        $workspace={mailbox.scope === 'workspace'}
                        $team={mailbox.scope === 'team'}
                        data-tip={scopeLabel}
                    >
                        <Icon icon={scopeIcon} width={12} />
                    </S.ScopeIcon>
                </AvatarSelectionToggle>
            ) : (
                <S.ScopeIcon
                    $workspace={mailbox.scope === 'workspace'}
                    $team={mailbox.scope === 'team'}
                    data-tip={scopeLabel}
                >
                    <Icon icon={scopeIcon} width={12} />
                </S.ScopeIcon>
            )}
            <S.AddressWrap>
                <S.Address>
                    {mailbox.slug}
                    <S.Domain>@{mailbox.domain_name}</S.Domain>
                </S.Address>
                <S.Meta>
                    {(mailbox.user_name || mailbox.scope !== 'owner') && (
                        <S.Owner>
                            {mailbox.user_id === userId ? 'You' : mailbox.user_name || '-'}
                        </S.Owner>
                    )}
                    {mailbox.scope === 'team' && mailbox.team_name && (
                        <S.TeamBadge>
                            <Icon icon="lucide:users-round" width={9} />
                            {mailbox.team_name}
                        </S.TeamBadge>
                    )}
                </S.Meta>
            </S.AddressWrap>
            {mailbox.unread_count > 0 && <S.UnreadBadge>{mailbox.unread_count}</S.UnreadBadge>}
            {canManage && (
                <S.Actions>
                    <S.ActionButton
                        onClick={event => stopAndRun(event, onEdit)}
                        title="Edit mailbox"
                    >
                        <Icon icon="lucide:settings" width={12} />
                    </S.ActionButton>
                    <S.ActionButton
                        $danger
                        onClick={event => stopAndRun(event, onDelete)}
                        title="Delete mailbox"
                    >
                        <Icon icon="lucide:trash-2" width={12} />
                    </S.ActionButton>
                </S.Actions>
            )}
        </S.Row>
    );
}
