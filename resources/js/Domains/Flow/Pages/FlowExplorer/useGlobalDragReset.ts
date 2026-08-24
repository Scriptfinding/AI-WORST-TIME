import { useEffect } from 'react';

// Clears explorer drag state when a document-level drag operation ends.
export function useGlobalDragReset(callback: () => void, active: boolean) {
    useEffect(() => {
        if (!active) return;

        document.addEventListener('dragend', callback);
        return () => document.removeEventListener('dragend', callback);
    }, [active, callback]);
}
