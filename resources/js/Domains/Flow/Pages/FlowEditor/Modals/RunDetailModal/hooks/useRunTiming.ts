import { useEffect, useState } from 'react';
import type { FlowRun } from '@/Domains/Flow/types';

// Derives elapsed, remaining, and timeout timing values for the active run.
export function useRunTiming(run: FlowRun | null, timeoutSeconds?: number | null) {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState<number | null>(null);

    useEffect(() => {
        if (!run || run.status !== 'running') {
            setTimeLeft(null);
            setElapsed(null);
            return;
        }

        const startedAt = new Date(run.running_at || run.created_at).getTime();
        const deadline = timeoutSeconds ? startedAt + timeoutSeconds * 1000 : null;
        const tick = () => {
            const now = Date.now();
            setElapsed(Math.max(0, Math.round((now - startedAt) / 1000)));
            setTimeLeft(deadline
                ? Math.max(0, Math.round((deadline - now) / 1000))
                : null);
        };

        tick();
        const interval = window.setInterval(tick, 1000);
        return () => window.clearInterval(interval);
    }, [run, timeoutSeconds]);

    return { elapsed, timeLeft };
}
