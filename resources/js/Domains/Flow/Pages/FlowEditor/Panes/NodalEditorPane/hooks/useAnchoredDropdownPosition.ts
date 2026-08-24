import {
    useCallback,
    useEffect,
    useState,
    type RefObject,
} from 'react';

export interface AnchoredDropdownRect {
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    placement: 'above' | 'below';
}

interface AnchoredDropdownPositionOptions {
    maxHeight: number;
    gap?: number;
    minHeight?: number;
    minWidth?: number;
    viewportPadding?: number;
    clampLeft?: boolean;
}

// Positions an anchored dropdown within the viewport and updates it on layout changes.
export function useAnchoredDropdownPosition<T extends HTMLElement>(
    triggerRef: RefObject<T | null>,
    open: boolean,
    {
        maxHeight,
        gap = 5,
        minHeight = 120,
        minWidth = 0,
        viewportPadding = 8,
        clampLeft = false,
    }: AnchoredDropdownPositionOptions,
) {
    const [dropdownRect, setDropdownRect] = useState<AnchoredDropdownRect | null>(null);

    const updateDropdownPosition = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
        const spaceAbove = rect.top - gap - viewportPadding;
        const openAbove = spaceBelow < maxHeight && spaceAbove > spaceBelow;
        const availableHeight = openAbove ? spaceAbove : spaceBelow;
        const resolvedMaxHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight));
        const width = Math.min(
            Math.max(rect.width, minWidth),
            window.innerWidth - (viewportPadding * 2),
        );
        const shouldClampLeft = clampLeft || width > rect.width;

        setDropdownRect({
            top: openAbove
                ? rect.top - gap
                : rect.bottom + gap,
            left: shouldClampLeft
                ? Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - width - viewportPadding))
                : rect.left,
            width,
            maxHeight: resolvedMaxHeight,
            placement: openAbove ? 'above' : 'below',
        });
    }, [clampLeft, gap, maxHeight, minHeight, minWidth, triggerRef, viewportPadding]);

    useEffect(() => {
        if (!open) return;

        updateDropdownPosition();
        window.addEventListener('resize', updateDropdownPosition);
        window.addEventListener('scroll', updateDropdownPosition, true);

        return () => {
            window.removeEventListener('resize', updateDropdownPosition);
            window.removeEventListener('scroll', updateDropdownPosition, true);
        };
    }, [open, updateDropdownPosition]);

    return { dropdownRect, updateDropdownPosition };
}
