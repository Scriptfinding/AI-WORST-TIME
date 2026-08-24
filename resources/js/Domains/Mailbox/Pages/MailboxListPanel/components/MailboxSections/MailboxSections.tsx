import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { MailboxItem } from '@/Domains/Mailbox/types';
import { useMailboxSections } from '@/Domains/Mailbox/Pages/MailboxListPanel/hooks/useMailboxSections';
import MailboxRow from '@/Domains/Mailbox/Pages/MailboxListPanel/components/MailboxRow/MailboxRow';
import * as S from './styled';

interface Props {
    activeMailboxId: Id | null;
    collapsedGroups: Set<string>;
    isAdmin: boolean;
    mailboxes: MailboxItem[];
    selectedIds: Set<Id>;
    onToggleSelected: (mailboxId: Id) => void;
    userId?: Id;
    isGroupHidden: (key: string) => boolean;
    onDeleteMailbox: (mailbox: MailboxItem) => void;
    onEditMailbox: (mailbox: MailboxItem) => void;
    onSelectMailbox: (mailbox: MailboxItem) => void;
    onToggleGroup: (key: string) => void;
}

export default function MailboxSections({
    activeMailboxId,
    collapsedGroups,
    isAdmin,
    mailboxes,
    selectedIds,
    onToggleSelected,
    userId,
    isGroupHidden,
    onDeleteMailbox,
    onEditMailbox,
    onSelectMailbox,
    onToggleGroup,
}: Props) {
    const { domainGroups, hasGroups, sections } = useMailboxSections(mailboxes);

    return (
        <>
            {hasGroups && sections.map(section => {
                const lastHeader = section.headers[section.headers.length - 1];
                const itemDepth = lastHeader ? lastHeader.depth + 1 : 0;
                const hideItems = isGroupHidden(section.groupKey);
                const visibleHeaders = section.headers.filter(header => {
                    const parentKey = header.key.split('/').slice(0, -1).join('/');
                    return !isGroupHidden(parentKey);
                });
                if (hideItems && visibleHeaders.length === 0) return null;

                return (
                    <React.Fragment key={section.groupKey}>
                        {visibleHeaders.map(header => (
                            <S.FolderLabel
                                key={header.key}
                                type="button"
                                $depth={header.depth}
                                onClick={() => onToggleGroup(header.key)}
                            >
                                <Icon
                                    icon={collapsedGroups.has(header.key)
                                        ? 'lucide:chevron-right'
                                        : 'lucide:chevron-down'}
                                    width={11}
                                />
                                <Icon icon="lucide:folder" width={10} />
                                <span>{header.label}</span>
                                <S.GroupCount>({header.count})</S.GroupCount>
                            </S.FolderLabel>
                        ))}
                        {!hideItems && section.items.map(mailbox => (
                            <MailboxRow
                                key={mailbox.id}
                                active={activeMailboxId === mailbox.id}
                                depth={itemDepth}
                                isAdmin={isAdmin}
                                mailbox={mailbox}
                                userId={userId}
                                selected={selectedIds.has(mailbox.id)}
                                onToggleSelected={onToggleSelected}
                                onDelete={onDeleteMailbox}
                                onEdit={onEditMailbox}
                                onSelect={onSelectMailbox}
                            />
                        ))}
                    </React.Fragment>
                );
            })}
            {Object.entries(domainGroups).map(([domain, domainMailboxes]) => (
                <S.DomainGroup key={domain}>
                    <S.DomainLabel>{domain}</S.DomainLabel>
                    {domainMailboxes.map(mailbox => (
                        <MailboxRow
                            key={mailbox.id}
                            active={activeMailboxId === mailbox.id}
                            depth={0}
                            isAdmin={isAdmin}
                            mailbox={mailbox}
                            userId={userId}
                            selected={selectedIds.has(mailbox.id)}
                            onToggleSelected={onToggleSelected}
                            onDelete={onDeleteMailbox}
                            onEdit={onEditMailbox}
                            onSelect={onSelectMailbox}
                        />
                    ))}
                </S.DomainGroup>
            ))}
        </>
    );
}
