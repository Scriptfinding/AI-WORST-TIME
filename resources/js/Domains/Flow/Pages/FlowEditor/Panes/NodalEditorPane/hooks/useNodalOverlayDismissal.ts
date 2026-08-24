import { useEffect } from 'react';
import type { UseNodalEditorEffectsOptions } from './useNodalEditorEffects.types';

type UseNodalOverlayDismissalOptions = Pick<UseNodalEditorEffectsOptions,
    | 'openNodeMenuId'
    | 'pendingNodePlacementRef'
    | 'pickerOpen'
    | 'setOpenNodeMenuId'
    | 'setPendingConnectionTarget'
    | 'setPendingEdgeInsertion'
    | 'setPickerOpen'
>;

// Closes node menus, pickers, and pending connections after outside interactions.
export function useNodalOverlayDismissal({
    openNodeMenuId,
    pendingNodePlacementRef,
    pickerOpen,
    setOpenNodeMenuId,
    setPendingConnectionTarget,
    setPendingEdgeInsertion,
    setPickerOpen,
}: UseNodalOverlayDismissalOptions) {
    useEffect(() => {
        const dismissals = [
            {
                open: Boolean(openNodeMenuId),
                insideSelector: '[data-node-hover-menu]',
                close: () => setOpenNodeMenuId(null),
            },
            {
                open: pickerOpen,
                insideSelector: '[data-node-picker], [data-node-picker-trigger]',
                close: () => {
                    setPickerOpen(false);
                    setPendingConnectionTarget(null);
                    setPendingEdgeInsertion(null);
                    pendingNodePlacementRef.current = null;
                },
            },
        ];
        if (!dismissals.some(({ open }) => open)) return;

        const closeOverlaysOnOutsidePointerDown = (event: PointerEvent) => {
            const target = event.target instanceof Element ? event.target : null;
            dismissals.forEach(({ open, insideSelector, close }) => {
                if (open && !target?.closest(insideSelector)) close();
            });
        };

        window.addEventListener('pointerdown', closeOverlaysOnOutsidePointerDown, true);
        return () => window.removeEventListener('pointerdown', closeOverlaysOnOutsidePointerDown, true);
    }, [
        openNodeMenuId,
        pendingNodePlacementRef,
        pickerOpen,
        setOpenNodeMenuId,
        setPendingConnectionTarget,
        setPendingEdgeInsertion,
        setPickerOpen,
    ]);
}
