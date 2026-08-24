import { useEffect } from 'react';

interface UseBeforeUnloadProtectionOptions {
    active: boolean;
    shouldBlock?: () => boolean;
    message?: string;
}

// Warns before leaving the page when active work would otherwise be lost.
export function useBeforeUnloadProtection({
    active,
    shouldBlock,
    message,
}: UseBeforeUnloadProtectionOptions) {
    useEffect(() => {
        if (!active) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (shouldBlock && !shouldBlock()) return;

            event.preventDefault();
            if (message !== undefined) {
                event.returnValue = message;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [active, message, shouldBlock]);
}
