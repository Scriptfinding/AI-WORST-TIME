import { useEffect, type RefObject } from 'react';
import { useClickOutside, type ClickOutsideEventType } from '@/Shared/Hooks/useClickOutside';

interface UseSearchablePopoverOptions {
    open: boolean;
    onDismiss: () => void;
    reset: () => void;
    focusRef: RefObject<HTMLElement | null>;
    containerRefs: RefObject<HTMLElement | null>[];
    eventType?: ClickOutsideEventType;
    capture?: boolean;
    focusDelay?: number;
}

// Coordinates outside-click dismissal and input focus for searchable popovers.
export function useSearchablePopover({
    open,
    onDismiss,
    reset,
    focusRef,
    containerRefs,
    eventType = 'mousedown',
    capture = false,
    focusDelay,
}: UseSearchablePopoverOptions) {
    useClickOutside({
        refs: containerRefs,
        onOutside: () => {
            onDismiss();
            reset();
        },
        enabled: open,
        eventType,
        capture,
    });

    useEffect(() => {
        if (!open) return;
        if (focusDelay === undefined) {
            focusRef.current?.focus();
            return;
        }

        const timeout = window.setTimeout(() => focusRef.current?.focus(), focusDelay);
        return () => window.clearTimeout(timeout);
    }, [focusDelay, focusRef, open]);
}
