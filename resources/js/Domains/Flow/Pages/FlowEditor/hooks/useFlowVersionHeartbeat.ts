import { useCallback, useEffect, useRef, useState } from 'react';
import type { Flow } from '@/Domains/Flow/types';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { csrfHeaders } from '@/Shared/Utils/csrf';

export interface FlowVersionSnapshot {
    content_updated_at: string | null;
    updated_at: string | null;
    code: string | null;
    nodal_graph: Flow['nodal_graph'] | null;
    flow_type: Flow['flow_type'];
}

interface UseFlowVersionHeartbeatOptions {
    flowId: Id;
    enabled: boolean;
    knownContentUpdatedAt: string | null;
}

const HEARTBEAT_INTERVAL_MS = 10000;

const toTimestamp = (value: string | null | undefined) => {
    if (!value) return 0;
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
};

export function isFlowVersionNewer(remoteContentUpdatedAt: string | null, knownContentUpdatedAt: string | null) {
    return toTimestamp(remoteContentUpdatedAt) > toTimestamp(knownContentUpdatedAt);
}

export function getFlowVersionContentUpdatedAt(snapshot: Pick<FlowVersionSnapshot, 'content_updated_at' | 'updated_at'>) {
    return snapshot.content_updated_at ?? snapshot.updated_at;
}

export function castNodalGraph(graph: FlowVersionSnapshot['nodal_graph']): NodalGraph | null {
    return graph as NodalGraph | null;
}

// Refreshes the flow edit lease and detects content changed by another session.
export function useFlowVersionHeartbeat({
    flowId,
    enabled,
    knownContentUpdatedAt,
}: UseFlowVersionHeartbeatOptions) {
    const [conflictVersion, setConflictVersion] = useState<FlowVersionSnapshot | null>(null);
    const knownContentUpdatedAtRef = useRef(knownContentUpdatedAt);

    useEffect(() => {
        knownContentUpdatedAtRef.current = knownContentUpdatedAt;
    }, [knownContentUpdatedAt]);

    useEffect(() => {
        setConflictVersion(null);
    }, [flowId]);

    const fetchLatestVersion = useCallback(async (signal?: AbortSignal) => {
        const response = await fetch(`/flows/${flowId}/version`, {
            method: 'GET',
            headers: csrfHeaders(),
            signal,
        });

        if (!response.ok) {
            throw new Error('Unable to fetch flow version.');
        }

        return response.json() as Promise<FlowVersionSnapshot>;
    }, [flowId]);

    const clearConflict = useCallback(() => {
        setConflictVersion(null);
    }, []);

    const checkNow = useCallback(async () => {
        try {
            const latest = await fetchLatestVersion();
            if (isFlowVersionNewer(getFlowVersionContentUpdatedAt(latest), knownContentUpdatedAtRef.current)) {
                setConflictVersion(latest);
            }
        } catch (error) {
            console.error(error);
        }
    }, [fetchLatestVersion]);

    useEffect(() => {
        if (!enabled) return;

        let stopped = false;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let controller: AbortController | null = null;

        const scheduleNext = () => {
            if (stopped) return;
            timeoutId = setTimeout(checkVersion, HEARTBEAT_INTERVAL_MS);
        };

        const checkVersion = async () => {
            controller?.abort();
            const activeController = new AbortController();
            controller = activeController;

            try {
                const latest = await fetchLatestVersion(activeController.signal);

                if (!stopped && isFlowVersionNewer(getFlowVersionContentUpdatedAt(latest), knownContentUpdatedAtRef.current)) {
                    setConflictVersion(latest);
                }
            } catch (error) {
                if (!activeController.signal.aborted) {
                    console.error(error);
                }
            } finally {
                scheduleNext();
            }
        };

        void checkVersion();

        return () => {
            stopped = true;
            controller?.abort();
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [enabled, fetchLatestVersion]);

    return {
        conflictVersion,
        clearConflict,
        checkNow,
        fetchLatestVersion,
    };
}
