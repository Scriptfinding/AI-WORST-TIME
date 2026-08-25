import { useCallback, useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import BulkDeleteConfirmation from '@/Shared/UI/BulkDeleteConfirmation/BulkDeleteConfirmation';
import { useAuth } from '@/App/Hooks/usePageProps';
import type { MailboxItem } from '@/Domains/Mailbox/types';
import { IntegrationCreationProvider } from '@/Domains/Integration/Contexts/IntegrationCreationContext';
import type { PageProps } from '@/App/types';
import MailboxesView from './Mailboxes/MailboxesView';
import { useBulkEmailSelection } from './Mailboxes/useBulkEmailSelection';
import { useMailboxEmails } from './Mailboxes/useMailboxEmails';
import { useMailboxModals } from './Mailboxes/useMailboxModals';
import { useMailboxNavigation } from './Mailboxes/useMailboxNavigation';
import type { MailboxesPageProps } from './Mailboxes/types';

export default function Mailboxes({
    mailboxes: initialMailboxes,
    domains,
    integrations,
    teams = [],
    isAdmin,
    mailboxGroups = [],
}: MailboxesPageProps) {
    const { settings } = usePage<InertiaPageProps & PageProps>().props;
    const { user } = useAuth();
    const { confirm, ConfirmModal } = useConfirm();
    const navigation = useMailboxNavigation(initialMailboxes);
    const emailState = useMailboxEmails(initialMailboxes, navigation.activeMailbox, confirm);
    const [selectedIds, setSelectedIds] = useState<Set<Id>>(() => new Set());
    const [deletingSelected, setDeletingSelected] = useState(false);
    const bulkSelection = useBulkEmailSelection({
        mailboxId: navigation.activeMailbox?.id ?? null,
        emails: emailState.emails,
        confirm,
        deleteEmails: emailState.deleteEmails,
        markEmails: emailState.markEmails,
    });
    const modals = useMailboxModals({
        mailboxes: emailState.mailboxes,
        activeMailboxId: navigation.activeMailbox?.id ?? null,
        confirm,
        clearMailbox: navigation.clearMailbox,
        clearEmails: emailState.clearEmails,
    });

    useEffect(() => {
        const availableIds = new Set(emailState.mailboxes.map(mailbox => mailbox.id));
        setSelectedIds(current => {
            const next = new Set([...current].filter(id => availableIds.has(id)));
            return next.size === current.size ? current : next;
        });
    }, [emailState.mailboxes]);

    const toggleMailboxSelection = (mailboxId: Id) => {
        setSelectedIds(current => {
            const next = new Set(current);
            if (next.has(mailboxId)) {
                next.delete(mailboxId);
            } else {
                next.add(mailboxId);
            }
            return next;
        });
    };

    const deleteSelectedMailboxes = async () => {
        const selectedMailboxes = emailState.mailboxes.filter(mailbox => selectedIds.has(mailbox.id));
        if (selectedMailboxes.length === 0) return;

        const confirmed = await confirm({
            title: selectedMailboxes.length === 1 ? 'Delete Mailbox' : 'Delete Mailboxes',
            message: (
                <BulkDeleteConfirmation
                    description="All emails stored in these mailboxes will also be permanently deleted."
                    items={selectedMailboxes.map(mailbox => ({
                        id: mailbox.id,
                        title: mailbox.address,
                        subtitle: `${mailbox.emails_count} email${mailbox.emails_count === 1 ? '' : 's'}`,
                        icon: <Icon icon="lucide:inbox" width={22} height={22} />,
                    }))}
                />
            ),
            confirmLabel: `Delete (${selectedMailboxes.length})`,
            variant: 'danger',
        });
        if (!confirmed) return;

        setDeletingSelected(true);
        router.delete('/mailboxes/bulk-delete', {
            data: { ids: selectedMailboxes.map(mailbox => mailbox.id) },
            preserveScroll: true,
            onSuccess: () => {
                if (navigation.activeMailbox && selectedIds.has(navigation.activeMailbox.id)) {
                    navigation.clearMailbox();
                    emailState.clearEmails();
                }
                setSelectedIds(new Set());
            },
            onFinish: () => setDeletingSelected(false),
        });
    };

    const handleSelectMailbox = useCallback((mailbox: MailboxItem) => {
        emailState.clearActiveEmail();
        navigation.selectMailbox(mailbox);
    }, [emailState, navigation]);

    const handleBackToMailboxes = useCallback(() => {
        emailState.clearEmails();
        navigation.clearMailbox();
    }, [emailState, navigation]);

    return (
        <IntegrationCreationProvider
            teams={teams}
            enabled={isAdmin}
            mailboxReloadKeys={['domains', 'integrations']}
        >
        <MailboxesView
            domains={domains}
            integrations={integrations}
            teams={teams}
            isAdmin={isAdmin}
            mailboxEnabled={settings.mailbox_enabled}
            mailboxGroups={mailboxGroups}
            canDeleteEmails={isAdmin || navigation.activeMailbox?.user_id === user?.id}
            navigation={navigation}
            emailState={emailState}
            bulkSelection={bulkSelection}
            modals={modals}
            ConfirmModal={ConfirmModal}
            selectedMailboxIds={selectedIds}
            deletingSelectedMailboxes={deletingSelected}
            onToggleMailboxSelection={toggleMailboxSelection}
            onDeleteSelectedMailboxes={deleteSelectedMailboxes}
            onSelectMailbox={handleSelectMailbox}
            onBackToMailboxes={handleBackToMailboxes}
        />
        </IntegrationCreationProvider>
    );
}
