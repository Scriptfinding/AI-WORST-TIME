import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FlowRun } from '@/Domains/Flow/types';

export function useOptimisticRunCancellation(runs: FlowRun[]) {
    const [cancelledRunIds, setCancelledRunIds] = useState<Set<number>>(() => new Set());

    const displayedRuns = useMemo(() => runs.map(run => cancelledRunIds.has(run.id)
        ? { ...run, status: 'cancelled' as const }
        : run), [cancelledRunIds, runs]);

    const markRunCancelled = useCallback((runId: number) => {
        setCancelledRunIds(previous => new Set(previous).add(runId));
    }, []);

    const rollbackRunCancellation = useCallback((runId: number) => {
        setCancelledRunIds(previous => {
            if (!previous.has(runId)) return previous;
            const next = new Set(previous);
            next.delete(runId);
            return next;
        });
    }, []);

    useEffect(() => {
        setCancelledRunIds(previous => {
            const next = new Set(
                [...previous].filter(runId => {
                    const run = runs.find(candidate => candidate.id === runId);
                    return run?.status === 'pending' || run?.status === 'running';
                }),
            );
            return next.size === previous.size ? previous : next;
        });
    }, [runs]);

    return {
        displayedRuns,
        markRunCancelled,
        rollbackRunCancellation,
    };
}
