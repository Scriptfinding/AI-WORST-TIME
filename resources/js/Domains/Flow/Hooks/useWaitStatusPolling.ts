import { useEffect, useMemo, useRef } from 'react';

export interface WaitStatusRunRef {
    id: number;
    flowId: Id;
}

export interface WaitStatusData {
    waiting: boolean;
    wait_id: string | null;
    validation_message: string | null;
}

export type WaitStatusPollResult =
    | {
        ok: true;
        run: WaitStatusRunRef;
        data: WaitStatusData;
    }
    | {
        ok: false;
        run: WaitStatusRunRef;
        error: unknown;
    };

interface UseWaitStatusPollingOptions<T> {
    runs: WaitStatusRunRef[];
    active: boolean;
    interval: number;
    transform: (results: WaitStatusPollResult[]) => T;
    onData: (data: T) => void;
}

// Polls wait-status endpoints for a changing set of flow runs and publishes transformed results.
export function useWaitStatusPolling<T>({
    runs,
    active,
    interval,
    transform,
    onData,
}: UseWaitStatusPollingOptions<T>): void {
    const runsKey = useMemo(
        () => runs.map(run => `${run.id}:${run.flowId}`).join(','),
        [runs],
    );
    const runsRef = useRef(runs);
    const transformRef = useRef(transform);
    const onDataRef = useRef(onData);

    runsRef.current = runs;
    transformRef.current = transform;
    onDataRef.current = onData;

    useEffect(() => {
        if (!active || runsRef.current.length === 0) return;

        let cancelled = false;
        let polling = false;
        const controllers = new Set<AbortController>();

        const poll = async () => {
            if (polling) return;
            polling = true;

            try {
                const results = await Promise.all(
                    runsRef.current.map(async (run): Promise<WaitStatusPollResult> => {
                        const controller = new AbortController();
                        controllers.add(controller);

                        try {
                            const response = await fetch(
                                `/flows/${run.flowId}/runs/${run.id}/wait-status`,
                                { signal: controller.signal },
                            );
                            if (!response.ok) {
                                throw new Error(`Wait status request failed with HTTP ${response.status}.`);
                            }

                            const data = await response.json() as Partial<WaitStatusData>;
                            if (
                                typeof data.waiting !== 'boolean'
                                || (data.wait_id !== null && typeof data.wait_id !== 'string')
                                || (data.validation_message !== null && typeof data.validation_message !== 'string')
                            ) {
                                throw new Error('Wait status response is malformed.');
                            }

                            return { ok: true, run, data: data as WaitStatusData };
                        } catch (error) {
                            return { ok: false, run, error };
                        } finally {
                            controllers.delete(controller);
                        }
                    }),
                );

                if (!cancelled) {
                    onDataRef.current(transformRef.current(results));
                }
            } finally {
                polling = false;
            }
        };

        poll();
        const intervalId = setInterval(poll, interval);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
            controllers.forEach(controller => controller.abort());
            controllers.clear();
        };
    }, [active, interval, runsKey]);
}
