import { useCallback, useEffect, useState } from 'react';
import type { MailboxItem } from '@/Domains/Mailbox/types';

// Synchronizes the selected mailbox with the URL and responsive pane navigation.
export function useMailboxNavigation(initialMailboxes: MailboxItem[]) {
    const [activeMailbox, setActiveMailbox] = useState<MailboxItem | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

        setIsMobile(mediaQuery.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        const id = new URLSearchParams(window.location.search).get('m');
        if (!id) return;

        const mailbox = initialMailboxes.find(item => String(item.id) === id);
        if (mailbox) setActiveMailbox(mailbox);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const selectMailbox = useCallback((mailbox: MailboxItem) => {
        setActiveMailbox(mailbox);
        const url = new URL(window.location.href);
        url.searchParams.set('m', String(mailbox.id));
        window.history.replaceState(null, '', url.toString());
    }, []);

    const clearMailbox = useCallback(() => {
        setActiveMailbox(null);
        const url = new URL(window.location.href);
        url.searchParams.delete('m');
        window.history.replaceState(null, '', url.toString());
    }, []);

    return {
        activeMailbox,
        isMobile,
        selectMailbox,
        clearMailbox,
    };
}
