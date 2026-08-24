import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import FeatureUnavailablePanel from '@/Domains/Licensing/Components/FeatureFlags/FeatureUnavailablePanel/FeatureUnavailablePanel';
import Button from '@/Shared/UI/Button/Button';
import type { MailboxItem } from '@/Domains/Mailbox/types';
import MailboxListPanel from '@/Domains/Mailbox/Pages/MailboxListPanel/MailboxListPanel';
import EmailListPanel from '@/Domains/Mailbox/Pages/EmailListPanel/EmailListPanel';
import EmailPreviewPanel from '@/Domains/Mailbox/Pages/EmailPreviewPanel/EmailPreviewPanel';
import EmptyMailboxPanel from './components/EmptyMailboxPanel/EmptyMailboxPanel';
import MailboxModals from './components/MailboxModals/MailboxModals';
import type { useMailboxNavigation } from './useMailboxNavigation';
import type { useMailboxEmails } from './useMailboxEmails';
import type { useBulkEmailSelection } from './useBulkEmailSelection';
import type { useMailboxModals } from './useMailboxModals';
import type { MailboxesPageProps } from './types';
import * as S from './styled';

interface Props extends Omit<MailboxesPageProps, 'mailboxes' | 'mailboxGroups'> {
    mailboxEnabled: boolean;
    mailboxGroups: string[];
    canDeleteEmails: boolean;
    navigation: ReturnType<typeof useMailboxNavigation>;
    emailState: ReturnType<typeof useMailboxEmails>;
    bulkSelection: ReturnType<typeof useBulkEmailSelection>;
    modals: ReturnType<typeof useMailboxModals>;
    ConfirmModal: React.ComponentType;
    selectedMailboxIds: Set<Id>;
    deletingSelectedMailboxes: boolean;
    onToggleMailboxSelection: (mailboxId: Id) => void;
    onDeleteSelectedMailboxes: () => void;
    onSelectMailbox: (mailbox: MailboxItem) => void;
    onBackToMailboxes: () => void;
}

export default function MailboxesView({
    domains,
    integrations,
    teams,
    isAdmin,
    mailboxEnabled,
    mailboxGroups,
    canDeleteEmails,
    navigation,
    emailState,
    bulkSelection,
    modals,
    ConfirmModal,
    selectedMailboxIds,
    deletingSelectedMailboxes,
    onToggleMailboxSelection,
    onDeleteSelectedMailboxes,
    onSelectMailbox,
    onBackToMailboxes,
}: Props) {
    const { activeMailbox, isMobile } = navigation;
    const {
        mailboxes,
        emails,
        activeEmail,
        loadingEmails,
        emailPage,
        emailTotal,
        emailLastPage,
        emailSearch,
    } = emailState;

    return (
        <AppLayout
            title="Mailboxes"
            noPadding
            headerRight={mailboxEnabled && (isAdmin || selectedMailboxIds.size > 0) && (
                <S.HeaderActions>
                    {selectedMailboxIds.size > 0 && (
                        <Button
                            size="sm"
                            variant="danger"
                            loading={deletingSelectedMailboxes}
                            onClick={onDeleteSelectedMailboxes}
                        >
                            <Icon icon="lucide:trash-2" width={14} />
                            Delete ({selectedMailboxIds.size})
                        </Button>
                    )}
                    {isAdmin && (
                        <Button size="sm" onClick={modals.openCreate}>
                            <Icon icon="lucide:plus" width={14} />
                            <S.HeaderButtonLabel>New Mailbox</S.HeaderButtonLabel>
                        </Button>
                    )}
                </S.HeaderActions>
            )}
        >
            {!mailboxEnabled ? (
                <FeatureUnavailablePanel />
            ) : (
                <S.Container>
                    {(!isMobile || !activeMailbox) && (
                        <MailboxListPanel
                            mailboxes={mailboxes}
                            activeMailboxId={activeMailbox?.id ?? null}
                            teams={teams}
                            integrations={integrations}
                            isAdmin={isAdmin}
                            selectedIds={selectedMailboxIds}
                            onToggleSelected={onToggleMailboxSelection}
                            onSelectMailbox={onSelectMailbox}
                            onEditMailbox={modals.openEdit}
                            onDeleteMailbox={modals.deleteMailbox}
                        />
                    )}

                    {activeMailbox && (!isMobile || !activeEmail) && (
                        <EmailListPanel
                            activeMailbox={activeMailbox}
                            emails={emails}
                            loadingEmails={loadingEmails}
                            emailPage={emailPage}
                            emailTotal={emailTotal}
                            emailLastPage={emailLastPage}
                            emailSearch={emailSearch}
                            activeEmailId={activeEmail?.id ?? null}
                            selectedEmailIds={bulkSelection.selectedEmailIds}
                            deletingSelected={bulkSelection.deletingSelected}
                            markingRead={bulkSelection.markingRead}
                            markingUnread={bulkSelection.markingUnread}
                            canDeleteEmails={canDeleteEmails}
                            onSelectEmail={emailState.selectEmail}
                            onEmailSearch={emailState.searchEmails}
                            onRefresh={() => emailState.loadEmails(activeMailbox.id, 1, emailSearch)}
                            onLoadMore={() => emailState.loadEmails(activeMailbox.id, emailPage + 1, emailSearch)}
                            onToggleEmailSelection={bulkSelection.toggleEmailSelection}
                            onToggleSelectAll={bulkSelection.toggleSelectAll}
                            onDeleteSelected={bulkSelection.deleteSelected}
                            onMarkSelectedRead={bulkSelection.markSelectedRead}
                            onMarkSelectedUnread={bulkSelection.markSelectedUnread}
                            onBack={isMobile ? onBackToMailboxes : undefined}
                        />
                    )}

                    {activeEmail ? (
                        <EmailPreviewPanel
                            email={activeEmail}
                            canDeleteEmails={canDeleteEmails}
                            onToggleRead={emailState.toggleActiveEmailRead}
                            onDeleteEmail={emailState.deleteActiveEmail}
                            onBack={isMobile ? emailState.clearActiveEmail : undefined}
                        />
                    ) : !activeMailbox && !isMobile ? (
                        <EmptyMailboxPanel />
                    ) : null}
                </S.Container>
            )}

            <MailboxModals
                domains={domains}
                teams={teams}
                groups={mailboxGroups}
                modals={modals}
                ConfirmModal={ConfirmModal}
            />
        </AppLayout>
    );
}
