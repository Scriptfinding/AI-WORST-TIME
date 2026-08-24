import type { RefObject } from 'react';
import { useClickOutside } from '@/Shared/Hooks/useClickOutside';

// Dismisses an open sidebar surface when a pointer press starts outside it.
export function useDismissOnPointerDownOutside(
    ref: RefObject<HTMLElement | null>,
    open: boolean,
    onDismiss: () => void,
) {
    useClickOutside({
        refs: [ref],
        onOutside: onDismiss,
        enabled: open,
        eventType: 'pointerdown',
    });
}
