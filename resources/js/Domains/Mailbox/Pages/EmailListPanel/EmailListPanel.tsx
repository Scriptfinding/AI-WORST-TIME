import React, { useState, useMemo } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import type { MailboxItem, MailboxEmail } from '@/Domains/Mailbox/types';
import {
    EmptyPanel,
    Panel,
    PanelBody,
    PanelHeader,
    PanelHeaderLeft,
    PanelHeaderRight,
    PanelTitle,
} from '@/Domains/Mailbox/Pages/shared.styled';
import * as S from './styled';
import { timeAgo } from './utils';

interface Props {
    activeMailbox: MailboxItem;
    emails: MailboxEmail[];
    loadingEmails: boolean;
    emailPage: number;
    emailTotal: number;
    emailLastPage: number;
    emailSearch: string;
    activeEmailId: number | null;
    selectedEmailIds: Set<number>;
    deletingSelected: boolean;
    markingRead: boolean;
    markingUnread: boolean;
    canDeleteEmails: boolean;
    onSelectEmail: (email: MailboxEmail) => void;
    onEmailSearch: (val: string) => void;
    onRefresh: () => void;
    onLoadMore: () => void;
    onToggleEmailSelection: (emailId: number, e: React.MouseEvent) => void;
    onToggleSelectAll: () => void;
    onDeleteSelected: () => void;
    onMarkSelectedRead: () => void;
    onMarkSelectedUnread: () => void;
    onBack?: () => void;
}

export default function EmailListPanel({
    activeMailbox,
    emails,
    loadingEmails,
    emailPage,
    emailTotal,
    emailLastPage,
    emailSearch,
    activeEmailId,
    selectedEmailIds,
    deletingSelected,
    markingRead,
    markingUnread,
    canDeleteEmails,
    onSelectEmail,
    onEmailSearch,
    onRefresh,
    onLoadMore,
    onToggleEmailSelection,
    onToggleSelectAll,
    onDeleteSelected,
    onMarkSelectedRead,
    onMarkSelectedUnread,
    onBack,
}: Props) {
    const [emailSortNewest, setEmailSortNewest] = useState(true);

    const sortedEmails = useMemo(() => {
        return [...emails].sort((a, b) => {
            const ta = new Date(a.received_at).getTime();
            const tb = new Date(b.received_at).getTime();
            return emailSortNewest ? tb - ta : ta - tb;
        });
    }, [emails, emailSortNewest]);

    return (
        <Panel $width="340px">
            <PanelHeader>
                <PanelHeaderLeft>
                    {onBack && (
                        <S.BackBtn onClick={onBack}>
                            <Icon icon="lucide:arrow-left" width={16} />
                        </S.BackBtn>
                    )}
                    <PanelTitle>{activeMailbox.address}</PanelTitle>
                </PanelHeaderLeft>
                <PanelHeaderRight>
                    <Button
                        size="sm"
                        variant="ghost"
                        style={{ padding: '4px 8px' }}
                        onClick={onRefresh}
                    >
                        <Icon icon="lucide:refresh-cw" width={13} />
                    </Button>
                    {selectedEmailIds.size > 0 && (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                style={{ padding: '4px 8px' }}
                                onClick={onMarkSelectedRead}
                                loading={markingRead}
                                title={`Mark ${selectedEmailIds.size} as read`}
                            >
                                <Icon icon="lucide:mail-open" width={13} />
                                {selectedEmailIds.size}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                style={{ padding: '4px 8px' }}
                                onClick={onMarkSelectedUnread}
                                loading={markingUnread}
                                title={`Mark ${selectedEmailIds.size} as unread`}
                            >
                                <Icon icon="lucide:mail" width={13} />
                                {selectedEmailIds.size}
                            </Button>
                            {canDeleteEmails && (
                                <Button
                                    size="sm"
                                    variant="danger"
                                    style={{ padding: '4px 8px' }}
                                    onClick={onDeleteSelected}
                                    loading={deletingSelected}
                                    title={`Delete ${selectedEmailIds.size} selected`}
                                >
                                    <Icon icon="lucide:trash-2" width={13} />
                                    {selectedEmailIds.size}
                                </Button>
                            )}
                        </>
                    )}
                </PanelHeaderRight>
            </PanelHeader>

            <S.SearchBox>
                <S.SelectAllCheckbox
                    type="checkbox"
                    checked={emails.length > 0 && selectedEmailIds.size === emails.length}
                    onChange={onToggleSelectAll}
                    title="Select all"
                />
                <S.SearchInput
                    value={emailSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEmailSearch(e.target.value)}
                    placeholder="Search emails..."
                />
                <S.SortBtn
                    onClick={() => setEmailSortNewest(v => !v)}
                    title={emailSortNewest ? 'Newest first' : 'Oldest first'}
                >
                    <Icon icon={emailSortNewest ? 'lucide:arrow-down-wide-narrow' : 'lucide:arrow-up-narrow-wide'} width={14} />
                </S.SortBtn>
            </S.SearchBox>

            <PanelBody>
                {loadingEmails && emails.length === 0 ? (
                    <EmptyPanel><S.Spinner /></EmptyPanel>
                ) : emails.length === 0 ? (
                    <EmptyPanel>No emails{emailSearch ? ' matching your search' : ''}</EmptyPanel>
                ) : (
                    <>
                        {sortedEmails.map(email => (
                            <S.EmailItem
                                key={email.id}
                                $active={activeEmailId === email.id}
                                $unread={!email.is_read}
                                $selected={selectedEmailIds.has(email.id)}
                                onClick={() => onSelectEmail(email)}
                            >
                                <S.EmailIconWrap>
                                    <S.EmailIconDefault>
                                        <Icon
                                            icon={email.is_read ? 'lucide:mail-open' : 'lucide:mail'}
                                            width={14}
                                        />
                                    </S.EmailIconDefault>
                                    <S.EmailCheckbox
                                        type="checkbox"
                                        checked={selectedEmailIds.has(email.id)}
                                        onChange={() => {}}
                                        onClick={(e: React.MouseEvent) => onToggleEmailSelection(email.id, e)}
                                    />
                                </S.EmailIconWrap>
                                <S.EmailContent>
                                    <S.EmailRow>
                                        <S.EmailFrom $unread={!email.is_read}>
                                            {email.from_address}
                                        </S.EmailFrom>
                                        <S.EmailDate>{timeAgo(email.received_at)}</S.EmailDate>
                                    </S.EmailRow>
                                    <S.EmailSubject $unread={!email.is_read}>
                                        {email.subject || '(No subject)'}
                                    </S.EmailSubject>
                                </S.EmailContent>
                            </S.EmailItem>
                        ))}
                        {emailPage < emailLastPage && (
                            <S.LoadMore>
                                <S.LoadMoreBtn onClick={onLoadMore}>
                                    Load more ({emailTotal - emails.length} remaining)
                                </S.LoadMoreBtn>
                            </S.LoadMore>
                        )}
                    </>
                )}
            </PanelBody>
        </Panel>
    );
}
