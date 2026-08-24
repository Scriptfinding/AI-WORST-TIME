import { useEffect, useRef, type RefObject } from 'react';

export type ClickOutsideEventType = 'click' | 'mousedown' | 'pointerdown';

interface UseClickOutsideOptions {
    refs: readonly RefObject<HTMLElement | null>[];
    onOutside: () => void;
    enabled?: boolean;
    eventType?: ClickOutsideEventType;
    capture?: boolean;
    requireAllRefs?: boolean;
    ignoreSelectors?: readonly string[];
}

// Invokes a stable callback when an interaction occurs outside every tracked element.
export function useClickOutside({
    refs,
    onOutside,
    enabled = true,
    eventType = 'mousedown',
    capture = false,
    requireAllRefs = false,
    ignoreSelectors = [],
}: UseClickOutsideOptions) {
    const interactionRef = useRef({ refs, onOutside, ignoreSelectors });
    interactionRef.current = { refs, onOutside, ignoreSelectors };

    useEffect(() => {
        if (!enabled) return;

        const handleOutsideInteraction = (event: Event) => {
            const { refs: currentRefs, ignoreSelectors: currentIgnoreSelectors } = interactionRef.current;
            const target = event.target;
            if (
                target instanceof Element
                && currentIgnoreSelectors.some(selector => target.closest(selector))
            ) {
                return;
            }
            const containers = currentRefs
                .map(ref => ref.current)
                .filter((container): container is HTMLElement => container !== null);

            if (
                containers.length > 0
                && (!requireAllRefs || containers.length === currentRefs.length)
                && containers.every(container => !container.contains(event.target as Node))
            ) {
                interactionRef.current.onOutside();
            }
        };

        document.addEventListener(eventType, handleOutsideInteraction, capture);
        return () => document.removeEventListener(eventType, handleOutsideInteraction, capture);
    }, [capture, enabled, eventType, requireAllRefs]);
}
