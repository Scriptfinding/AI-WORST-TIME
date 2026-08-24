import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FlowRun } from '@/Domains/Flow/types';
import { hasOpenModal } from '@/Domains/Flow/Pages/Runs/utils';

// Maintains run selection across active and terminated run lists.
export function useRunSelection(runningRuns: FlowRun[], terminatedRuns: FlowRun[]) {
    const [selectedRunIds, setSelectedRunIds] = useState<Set<number>>(() => new Set());
    const allRuns = useMemo(() => [...runningRuns, ...terminatedRuns], [runningRuns, terminatedRuns]);
    const selectedRunningRuns = runningRuns.filter(run => selectedRunIds.has(run.id));
    const selectedTerminatedRuns = terminatedRuns.filter(run => selectedRunIds.has(run.id));

    useEffect(() => {
        setSelectedRunIds(previous => {
            const visibleIds = new Set(allRuns.map(run => run.id));
            const next = new Set([...previous].filter(id => visibleIds.has(id)));
            return next.size === previous.size ? previous : next;
        });
    }, [allRuns]);

    const toggleRunSelection = useCallback((run: FlowRun) => {
        setSelectedRunIds(previous => {
            const next = new Set(previous);
            if (next.has(run.id)) next.delete(run.id);
            else next.add(run.id);
            return next;
        });
    }, []);

    const clearAllRunSelection = useCallback(() => setSelectedRunIds(new Set()), []);

    useEffect(() => {
        if (selectedRunIds.size === 0) return;
        const handleEscapeSelection = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || hasOpenModal()) return;
            clearAllRunSelection();
        };
        document.addEventListener('keydown', handleEscapeSelection);
        return () => document.removeEventListener('keydown', handleEscapeSelection);
    }, [clearAllRunSelection, selectedRunIds.size]);

    const clearRunSelection = useCallback((runs: FlowRun[]) => {
        const runIds = new Set(runs.map(run => run.id));
        setSelectedRunIds(previous => {
            const next = new Set(previous);
            runIds.forEach(id => next.delete(id));
            return next;
        });
    }, []);

    const toggleVisibleRunSelection = useCallback((runs: FlowRun[]) => {
        const visibleIds = runs.map(run => run.id);
        setSelectedRunIds(previous => {
            const next = new Set(previous);
            const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => previous.has(id));
            if (allVisibleSelected) visibleIds.forEach(id => next.delete(id));
            else visibleIds.forEach(id => next.add(id));
            return next;
        });
    }, []);

    const removeRunIdsFromSelection = useCallback((ids: number[]) => {
        const idSet = new Set(ids);
        setSelectedRunIds(previous => {
            const next = new Set(previous);
            idSet.forEach(id => next.delete(id));
            return next;
        });
    }, []);

    return {
        selectedRunIds,
        selectedRunningRuns,
        selectedTerminatedRuns,
        toggleRunSelection,
        toggleVisibleRunSelection,
        clearRunSelection,
        removeRunIdsFromSelection,
    };
}
