import { useEffect, useRef, type RefObject } from 'react';
import { useClickOutside, type ClickOutsideEventType } from '@/Shared/Hooks/useClickOutside';

interface UseActionMenuDismissOptions {
    open: boolean;
    refs: readonly RefObject<HTMLElement | null>[];
    onDismiss: () => void;
    closeOnScroll?: boolean;
    eventType?: ClickOutsideEventType;
    eventCapture?: boolean;
    requireAllRefs?: boolean;
    scrollCapture?: boolean;
}

// Closes workspace action menus on outside interaction or captured scrolling.
export function useActionMenuDismiss({
    open,
    refs,
    onDismiss,
    closeOnScroll = true,
    eventType = 'mousedown',
    eventCapture = false,
    requireAllRefs = true,
    scrollCapture = true,
}: UseActionMenuDismissOptions) {
    const onDismissRef = useRef(onDismiss);
    onDismissRef.current = onDismiss;

    useClickOutside({
        refs,
        onOutside: onDismiss,
        enabled: open,
        eventType,
        capture: eventCapture,
        requireAllRefs,
    });

    useEffect(() => {
        if (!open || !closeOnScroll) return;
        const handleScroll = () => onDismissRef.current();

        window.addEventListener('scroll', handleScroll, scrollCapture);

        return () => {
            window.removeEventListener('scroll', handleScroll, scrollCapture);
        };
    }, [closeOnScroll, open, scrollCapture]);
}
