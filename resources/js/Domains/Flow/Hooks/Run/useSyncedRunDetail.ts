import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { FlowRun } from '@/Domains/Flow/types';

// Keeps the selected run detail aligned with refreshed run-list data.
export function useSyncedRunDetail(
    runs: FlowRun[],
    selectedRun: FlowRun | null,
    setSelectedRun: Dispatch<SetStateAction<FlowRun | null>>,
) {
    useEffect(() => {
        if (!selectedRun) return;

        const freshRun = runs.find(run => run.id === selectedRun.id) ?? null;
        if (freshRun !== selectedRun) setSelectedRun(freshRun);
    }, [runs, selectedRun, setSelectedRun]);
}
