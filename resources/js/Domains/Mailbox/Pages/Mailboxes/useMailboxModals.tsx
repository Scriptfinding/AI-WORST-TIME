import React, { useCallback, useState } from 'react';
import { router } from '@inertiajs/react';
import type { MailboxItem } from '@/Domains/Mailbox/types';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import { renderFlowList } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/renderFlowList';
import type { FlowUsage } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/types';
import { fetchJson } from './api';
import type { Confirm } from './types';

interface Options {
    mailboxes: MailboxItem[];
    activeMailboxId: Id | null;
    confirm: Confirm;
    clearMailbox: () => void;
    clearEmails: () => void;
}

// Controls mailbox create and edit dialogs and confirms deletion with usage context.
export function useMailboxModals({
    mailboxes,
    activeMailboxId,
    confirm,
    clearMailbox,
    clearEmails,
}: Options) {
    const [showCreate, setShowCreate] = useState(false);
    const {
        selectedItem: editMailbox,
        openModal: openEdit,
        closeModal: closeEdit,
    } = useUrlSyncedModal(mailboxes, 'edit');

    const deleteMailbox = useCallback(async (mailbox: MailboxItem) => {
        let usageContent: React.ReactNode | null = null;
        try {
            const data = await fetchJson<{
                flows: (FlowUsage & { watchers: string[] })[];
                watchers_count: number;
            }>(`/mailboxes/${mailbox.id}/watcher-usages`);
            if (data.flows.length > 0) {
                usageContent = (
                    <>
                        {'\n\n'}{data.watchers_count} watcher(s) in {data.flows.length} flow(s) will be affected:
                        {renderFlowList(data.flows)}
                    </>
                );
            }
        } catch {}

        const confirmed = await confirm({
            title: 'Delete Mailbox',
            message: usageContent
                ? <>Delete "{mailbox.address}" and all its emails?{usageContent}</>
                : `Delete "${mailbox.address}" and all its emails? This cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (!confirmed) return;

        if (activeMailboxId === mailbox.id) {
            clearEmails();
            clearMailbox();
        }
        router.delete(`/mailboxes/${mailbox.id}`, { preserveScroll: true });
    }, [activeMailboxId, clearEmails, clearMailbox, confirm]);

    return {
        showCreate,
        editMailbox,
        openCreate: () => setShowCreate(true),
        closeCreate: () => setShowCreate(false),
        openEdit,
        closeEdit,
        deleteMailbox,
    };
}
