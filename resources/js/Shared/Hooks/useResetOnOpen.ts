import { useEffect, useRef } from 'react';

// Resets transient state each time a closed surface becomes open.
export function useResetOnOpen(isOpen: boolean, reset: () => void) {
    const resetRef = useRef(reset);
    resetRef.current = reset;

    useEffect(() => {
        if (!isOpen) return;

        resetRef.current();
    }, [isOpen]);
}
