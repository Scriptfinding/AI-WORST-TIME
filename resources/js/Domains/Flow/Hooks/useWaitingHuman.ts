import { useEffect, useState } from 'react';
import {
    useWaitStatusPolling,
    type WaitStatusPollResult,
    type WaitStatusRunRef,
} from './useWaitStatusPolling';

interface WaitingPollState {
    waitingIds: Set<number>;
    failedIds: Set<number>;
}

function toWaitingState(results: WaitStatusPollResult[]): WaitingPollState {
    const waitingIds = new Set<number>();
    const failedIds = new Set<number>();

    results.forEach(result => {
        if (!result.ok) {
            failedIds.add(result.run.id);
        } else if (result.data.waiting) {
            waitingIds.add(result.run.id);
        }
    });

    return { waitingIds, failedIds };
}

// Tracks which running flows are currently paused for human validation.
export function useWaitingHumanSet(
    runningRuns: WaitStatusRunRef[],
    pollInterval = 4000,
): Set<number> {
    const [waitingIds, setWaitingIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (runningRuns.length === 0) {
            setWaitingIds(prev => (prev.size === 0 ? prev : new Set()));
        }
    }, [runningRuns.length]);

    useWaitStatusPolling({
        runs: runningRuns,
        active: runningRuns.length > 0,
        interval: pollInterval,
        transform: toWaitingState,
        onData: next => {
            setWaitingIds(prev => {
                const merged = new Set(next.waitingIds);
                next.failedIds.forEach(id => {
                    if (prev.has(id)) merged.add(id);
                });

                if (prev.size === merged.size && [...prev].every(id => merged.has(id))) return prev;
                return merged;
            });
        },
    });

    return waitingIds;
}
