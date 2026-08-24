import { useCallback, useEffect, useState, type MutableRefObject } from 'react';
import type { FlowRun } from '@/Domains/Flow/types';

function buildUrlWithRun(runId: number | null): string {
    const params = new URLSearchParams(window.location.search);
    if (runId != null) {
        params.set('run', String(runId));
    } else {
        params.delete('run');
    }
    const search = params.toString();
    return window.location.pathname + (search ? '?' + search : '') + window.location.hash;
}

// Keeps the selected run detail synchronized with the browser URL and history.
export function useRunDetailUrlState(
    runs: FlowRun[],
    pendingRunOpenRef: MutableRefObject<boolean>,
) {
    const [detailRun, setDetailRun] = useState<FlowRun | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const syncFromUrl = (event?: PopStateEvent) => {
            const runId = new URLSearchParams(window.location.search).get('run');
            const target = runId
                ? runs.find(run => String(run.id) === runId) ?? null
                : null;

            if (target || event) setDetailRun(target);
        };

        syncFromUrl();
        window.addEventListener('popstate', syncFromUrl);
        return () => window.removeEventListener('popstate', syncFromUrl);
    }, [runs]);

    useEffect(() => {
        if (!detailRun) return;
        const fresh = runs.find(run => run.id === detailRun.id);
        if (fresh && fresh !== detailRun) setDetailRun(fresh);
    }, [detailRun, runs]);

    useEffect(() => {
        if (!pendingRunOpenRef.current) return;
        const latestRun = runs.find(run => run.status === 'pending' || run.status === 'running');
        if (!latestRun) return;

        pendingRunOpenRef.current = false;
        setDetailRun(latestRun);
        const newUrl = buildUrlWithRun(latestRun.id);
        if (newUrl !== window.location.pathname + window.location.search + window.location.hash) {
            window.history.pushState({ runId: latestRun.id }, '', newUrl);
        }
    }, [pendingRunOpenRef, runs]);

    const handleViewRunDetails = useCallback((run: FlowRun) => {
        setDetailRun(run);
        const newUrl = buildUrlWithRun(run.id);
        if (newUrl !== window.location.pathname + window.location.search + window.location.hash) {
            window.history.pushState({ runId: run.id }, '', newUrl);
        }
    }, []);

    const handleCloseRunDetail = useCallback(() => {
        setDetailRun(null);
        const params = new URLSearchParams(window.location.search);
        if (params.has('run')) {
            window.history.pushState(null, '', buildUrlWithRun(null));
        }
    }, []);

    return {
        detailRun,
        handleViewRunDetails,
        handleCloseRunDetail,
    };
}
