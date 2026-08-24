import { useEffect } from 'react';
import type { UseNodalEditorEffectsOptions } from './useNodalEditorEffects.types';

type UseNodeEditingDismissalOptions = Pick<UseNodalEditorEffectsOptions,
    | 'editingNodeCurrent'
    | 'setEditingNode'
>;

function hasOpenFieldAutocomplete(): boolean {
    return document.querySelector([
        '.suggest-widget.visible',
        '.parameter-hints-widget.visible',
        '[data-node-field-dropdown="true"]',
    ].join(', ')) !== null;
}

// Ends inline node editing when focus or pointer activity leaves the editor.
export function useNodeEditingDismissal({
    editingNodeCurrent,
    setEditingNode,
}: UseNodeEditingDismissalOptions) {
    useEffect(() => {
        if (!editingNodeCurrent) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;

            const overlays = document.querySelectorAll<HTMLElement>('[data-modal-overlay]');
            const topOverlay = overlays[overlays.length - 1];
            if (topOverlay?.dataset.modalKind !== 'node-config') return;
            if (hasOpenFieldAutocomplete()) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            setEditingNode(null);
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [editingNodeCurrent, setEditingNode]);
}
