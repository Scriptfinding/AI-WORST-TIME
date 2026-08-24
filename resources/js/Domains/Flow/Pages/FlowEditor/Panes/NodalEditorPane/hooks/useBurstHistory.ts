import { useCallback, useRef } from 'react';

// Coalesces rapid related edits into one history snapshot for undo and redo.
export function useBurstHistory(recordHistory: () => void) {
    const lastBurstHistoryRef = useRef<{ targetKey: string; time: number } | null>(null);

    return useCallback((targetKey: string) => {
        const now = Date.now();
        const last = lastBurstHistoryRef.current;
        const isSameBurst = last !== null
            && last.targetKey === targetKey
            && now - last.time < 800;

        lastBurstHistoryRef.current = { targetKey, time: now };
        if (isSameBurst) return;

        recordHistory();
    }, [recordHistory]);
}
