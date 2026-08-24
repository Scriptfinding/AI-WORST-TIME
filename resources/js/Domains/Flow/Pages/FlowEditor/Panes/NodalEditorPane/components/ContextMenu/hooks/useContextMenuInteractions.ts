import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getEnabledMenuItems, getMenuPosition, type MenuPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/helpers';

interface UseContextMenuInteractionsOptions {
    anchor: MenuPosition;
    onClose: () => void;
}

// Handles context-menu focus, keyboard navigation, and outside-click dismissal.
export function useContextMenuInteractions({
    anchor,
    onClose,
}: UseContextMenuInteractionsOptions) {
    const menuRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const [position, setPosition] = useState(anchor);
    const { left, top } = anchor;

    const updatePosition = useCallback(() => {
        const menu = menuRef.current;
        if (!menu) return;

        setPosition(getMenuPosition(
            { left, top },
            menu.getBoundingClientRect(),
            { width: window.innerWidth, height: window.innerHeight },
        ));
    }, [left, top]);

    useLayoutEffect(() => {
        updatePosition();
    }, [updatePosition]);

    useEffect(() => {
        previousFocusRef.current = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

        const menu = menuRef.current;
        getEnabledMenuItems(menu ?? document.body)[0]?.focus();

        const handlePointerDown = (event: PointerEvent) => {
            if (menuRef.current?.contains(event.target as Node)) return;
            onClose();
        };
        const handleScroll = () => onClose();

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', updatePosition);

            const previousFocus = previousFocusRef.current;
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, [onClose, updatePosition]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        const menu = menuRef.current;
        if (!menu) return;

        const items = getEnabledMenuItems(menu);
        const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);

        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose();
            return;
        }

        let nextIndex: number | null = null;
        if (event.key === 'ArrowDown') nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        if (event.key === 'ArrowUp') nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        if (event.key === 'Tab') {
            nextIndex = event.shiftKey
                ? (currentIndex > 0 ? currentIndex - 1 : items.length - 1)
                : (currentIndex < items.length - 1 ? currentIndex + 1 : 0);
        }
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = items.length - 1;

        if (nextIndex === null || !items[nextIndex]) return;

        event.preventDefault();
        event.stopPropagation();
        items[nextIndex].focus();
    }, [onClose]);

    return { menuRef, position, handleKeyDown };
}
