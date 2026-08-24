import { useCallback, useEffect, useState } from 'react';
import type React from 'react';
import type { MailboxEmail } from '@/Domains/Mailbox/types';
import type { Confirm } from './types';

interface Options {
    mailboxId: Id | null;
    emails: MailboxEmail[];
    confirm: Confirm;
    deleteEmails: (ids: Set<number>) => Promise<void>;
    markEmails: (ids: Set<number>, isRead: boolean) => Promise<void>;
}

// Coordinates bulk message selection, deletion, and read-status updates.
export function useBulkEmailSelection({
    mailboxId,
    emails,
    confirm,
    deleteEmails,
    markEmails,
}: Options) {
    const [selectedEmailIds, setSelectedEmailIds] = useState<Set<number>>(new Set());
    const [deletingSelected, setDeletingSelected] = useState(false);
    const [markingRead, setMarkingRead] = useState(false);
    const [markingUnread, setMarkingUnread] = useState(false);

    useEffect(() => setSelectedEmailIds(new Set()), [mailboxId]);

    const toggleEmailSelection = useCallback((emailId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        setSelectedEmailIds(previous => {
            const next = new Set(previous);
            if (next.has(emailId)) next.delete(emailId);
            else next.add(emailId);
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelectedEmailIds(previous =>
            previous.size === emails.length
                ? new Set()
                : new Set(emails.map(email => email.id))
        );
    }, [emails]);

    const deleteSelected = useCallback(async () => {
        if (selectedEmailIds.size === 0) return;
        const count = selectedEmailIds.size;
        const confirmed = await confirm({
            title: 'Delete Emails',
            message: `Delete ${count} selected email${count > 1 ? 's' : ''}? This cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (!confirmed) return;

        setDeletingSelected(true);
        await deleteEmails(selectedEmailIds);
        setSelectedEmailIds(new Set());
        setDeletingSelected(false);
    }, [confirm, deleteEmails, selectedEmailIds]);

    const markSelectedRead = useCallback(async () => {
        if (selectedEmailIds.size === 0) return;
        setMarkingRead(true);
        await markEmails(selectedEmailIds, true);
        setSelectedEmailIds(new Set());
        setMarkingRead(false);
    }, [markEmails, selectedEmailIds]);

    const markSelectedUnread = useCallback(async () => {
        if (selectedEmailIds.size === 0) return;
        setMarkingUnread(true);
        await markEmails(selectedEmailIds, false);
        setSelectedEmailIds(new Set());
        setMarkingUnread(false);
    }, [markEmails, selectedEmailIds]);

    return {
        selectedEmailIds,
        deletingSelected,
        markingRead,
        markingUnread,
        toggleEmailSelection,
        toggleSelectAll,
        deleteSelected,
        markSelectedRead,
        markSelectedUnread,
    };
}
