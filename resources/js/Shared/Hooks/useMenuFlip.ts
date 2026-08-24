import { useLayoutEffect, useState, type RefObject } from 'react';

const VIEWPORT_MARGIN = 8;

/**
 * Flips a dropdown menu upward when it would overflow the bottom of the
 * viewport. Measure happens before paint, so the menu never flashes in the
 * wrong position.
 */
export function useMenuFlip(open: boolean, menuRef: RefObject<HTMLElement | null>): boolean {
    const [flipUp, setFlipUp] = useState(false);

    useLayoutEffect(() => {
        if (!open) {
            setFlipUp(false);
            return;
        }

        const menu = menuRef.current;
        if (!menu) return;

        const rect = menu.getBoundingClientRect();
        const overflowsBottom = rect.bottom > window.innerHeight - VIEWPORT_MARGIN;
        const fitsAbove = rect.top - rect.height > VIEWPORT_MARGIN;
        setFlipUp(overflowsBottom && fitsAbove);
    }, [open, menuRef]);

    return flipUp;
}
