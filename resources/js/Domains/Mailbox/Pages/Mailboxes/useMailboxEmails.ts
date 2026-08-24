import { useCallback, useEffect, useRef, useState } from 'react';
import type { MailboxEmail, MailboxItem } from '@/Domains/Mailbox/types';
import type { PaginatedData } from '@/Shared/Types/pagination';
import { fetchJson } from './api';
import type { Confirm } from './types';

// Loads paginated mailbox messages and keeps read, delete, and selection state aligned.
export function useMailboxEmails(
    initialMailboxes: MailboxItem[],
    activeMailbox: MailboxItem | null,
    confirm: Confirm,
) {
    const [mailboxes, setMailboxes] = useState(initialMailboxes);
    const [emails, setEmails] = useState<MailboxEmail[]>([]);
    const [activeEmail, setActiveEmail] = useState<MailboxEmail | null>(null);
    const [loadingEmails, setLoadingEmails] = useState(false);
    const [emailPage, setEmailPage] = useState(1);
    const [emailTotal, setEmailTotal] = useState(0);
    const [emailLastPage, setEmailLastPage] = useState(1);
    const [emailSearch, setEmailSearch] = useState('');
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const loadController = useRef<AbortController | null>(null);
    const activeMailboxId = activeMailbox?.id;

    useEffect(() => setMailboxes(initialMailboxes), [initialMailboxes]);

    const adjustUnread = useCallback((mailboxId: Id, delta: number) => {
        setMailboxes(previous => previous.map(mailbox =>
            mailbox.id === mailboxId
                ? { ...mailbox, unread_count: Math.max(0, mailbox.unread_count + delta) }
                : mailbox
        ));
    }, []);

    const loadEmails = useCallback(async (mailboxId: Id, page: number, searchQuery: string) => {
        loadController.current?.abort();
        const controller = new AbortController();
        loadController.current = controller;
        setLoadingEmails(true);

        try {
            const params = new URLSearchParams({ page: String(page), per_page: '30' });
            if (searchQuery) params.set('search', searchQuery);
            const data = await fetchJson<PaginatedData<MailboxEmail>>(
                `/mailboxes/${mailboxId}/emails?${params}`,
                { signal: controller.signal },
            );
            if (controller.signal.aborted) return;

            setEmails(previous => page === 1 ? data.data : [...previous, ...data.data]);
            setEmailTotal(data.total);
            setEmailLastPage(data.last_page);
            setEmailPage(page);
            if (page === 1) setActiveEmail(null);
        } catch {
            if (controller.signal.aborted) return;
            setEmails([]);
            setActiveEmail(null);
        } finally {
            if (loadController.current === controller) {
                loadController.current = null;
                setLoadingEmails(false);
            }
        }
    }, []);

    const clearEmails = useCallback(() => {
        loadController.current?.abort();
        loadController.current = null;
        setLoadingEmails(false);
        setEmails([]);
        setActiveEmail(null);
    }, []);

    useEffect(() => {
        if (searchTimer.current) {
            clearTimeout(searchTimer.current);
            searchTimer.current = null;
        }
        setActiveEmail(null);
        setEmailSearch('');
        setEmailPage(1);

        if (activeMailboxId) {
            void loadEmails(activeMailboxId, 1, '');
        } else {
            clearEmails();
        }
    }, [activeMailboxId, clearEmails, loadEmails]);

    useEffect(() => () => {
        loadController.current?.abort();
        if (searchTimer.current) clearTimeout(searchTimer.current);
    }, []);

    const searchEmails = useCallback((value: string) => {
        setEmailSearch(value);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            if (activeMailbox) void loadEmails(activeMailbox.id, 1, value);
        }, 300);
    }, [activeMailbox, loadEmails]);

    const selectEmail = useCallback(async (email: MailboxEmail) => {
        const detailedEmail = await fetchJson<MailboxEmail>(`/mailbox-emails/${email.id}`);

        if (email.is_read) {
            setActiveEmail(detailedEmail);
            return;
        }

        const readEmail = { ...detailedEmail, is_read: true };
        setActiveEmail(readEmail);
        setEmails(previous => previous.map(item => item.id === email.id ? readEmail : item));
        adjustUnread(email.mailbox_id, -1);
        await fetchJson(`/mailbox-emails/${email.id}/read`, { method: 'POST' });
    }, [adjustUnread]);

    const toggleActiveEmailRead = useCallback(async () => {
        if (!activeEmail) return;

        const isRead = !activeEmail.is_read;
        const updatedEmail = { ...activeEmail, is_read: isRead };
        setEmails(previous => previous.map(email => email.id === activeEmail.id ? updatedEmail : email));
        setActiveEmail(updatedEmail);
        adjustUnread(activeEmail.mailbox_id, isRead ? -1 : 1);
        await fetchJson(`/mailbox-emails/${activeEmail.id}/${isRead ? 'read' : 'unread'}`, { method: 'POST' });
    }, [activeEmail, adjustUnread]);

    const deleteActiveEmail = useCallback(async () => {
        if (!activeEmail) return;
        const confirmed = await confirm({
            title: 'Delete Email',
            message: `Delete this email from "${activeEmail.from_address}"?`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (!confirmed) return;

        await fetchJson(`/mailbox-emails/${activeEmail.id}`, { method: 'DELETE' });
        const remaining = emails.filter(email => email.id !== activeEmail.id);
        setEmails(remaining);
        setActiveEmail(remaining[0] ?? null);
    }, [activeEmail, confirm, emails]);

    const deleteEmails = useCallback(async (ids: Set<number>) => {
        await Promise.all(Array.from(ids).map(id =>
            fetchJson(`/mailbox-emails/${id}`, { method: 'DELETE' })
        ));
        const unreadDeleted = emails.filter(email => ids.has(email.id) && !email.is_read).length;
        if (activeMailbox && unreadDeleted > 0) adjustUnread(activeMailbox.id, -unreadDeleted);
        const remaining = emails.filter(email => !ids.has(email.id));
        setEmails(remaining);
        if (activeEmail && ids.has(activeEmail.id)) setActiveEmail(remaining[0] ?? null);
    }, [activeEmail, activeMailbox, adjustUnread, emails]);

    const markEmails = useCallback(async (ids: Set<number>, isRead: boolean) => {
        const changedIds = emails
            .filter(email => ids.has(email.id) && email.is_read !== isRead)
            .map(email => email.id);
        await Promise.all(changedIds.map(id =>
            fetchJson(`/mailbox-emails/${id}/${isRead ? 'read' : 'unread'}`, { method: 'POST' })
        ));
        if (activeMailbox && changedIds.length > 0) {
            adjustUnread(activeMailbox.id, isRead ? -changedIds.length : changedIds.length);
        }
        setEmails(previous => previous.map(email => ids.has(email.id) ? { ...email, is_read: isRead } : email));
        if (activeEmail && ids.has(activeEmail.id)) setActiveEmail({ ...activeEmail, is_read: isRead });
    }, [activeEmail, activeMailbox, adjustUnread, emails]);

    return {
        mailboxes,
        emails,
        activeEmail,
        loadingEmails,
        emailPage,
        emailTotal,
        emailLastPage,
        emailSearch,
        loadEmails,
        searchEmails,
        selectEmail,
        clearActiveEmail: () => setActiveEmail(null),
        clearEmails,
        toggleActiveEmailRead,
        deleteActiveEmail,
        deleteEmails,
        markEmails,
    };
}
