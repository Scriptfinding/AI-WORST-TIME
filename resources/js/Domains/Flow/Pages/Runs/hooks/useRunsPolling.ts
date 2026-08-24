import { useInertiaPolling } from '@/Shared/Hooks/useInertiaPolling';
import { useWaitingHumanSet } from '@/Domains/Flow/Hooks/useWaitingHuman';
import type { FlowRun } from '@/Domains/Flow/types';

// Polls active runs and returns the IDs currently being refreshed.
export function useRunsPolling(runs: FlowRun[], runningRunsCount: number): Set<number> {
    const waitingHumanIds = useWaitingHumanSet(
        runs
            .filter(run => run.status === 'running' && run.flow?.id)
            .map(run => ({ id: run.id, flowId: run.flow!.id })),
    );

    useInertiaPolling({
        only: ['runningRuns', 'terminatedRuns', 'stats'],
        active: runningRunsCount > 0,
        activeDelay: 3000,
        idleDelay: 10000,
        pauseWhenHidden: true,
    });

    return waitingHumanIds;
}
