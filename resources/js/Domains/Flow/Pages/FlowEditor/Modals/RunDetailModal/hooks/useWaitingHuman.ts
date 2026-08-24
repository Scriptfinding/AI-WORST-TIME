import { useCallback, useEffect, useRef, useState } from 'react';
import {
    useWaitStatusPolling,
    type WaitStatusData,
    type WaitStatusPollResult,
} from '@/Domains/Flow/Hooks/useWaitStatusPolling';
import type { FlowRun } from '@/Domains/Flow/types';
import { csrfHeaders } from '@/Shared/Utils/csrf';

function toWaitingState(results: WaitStatusPollResult[]): WaitStatusData | undefined {
    const result = results[0];
    return result?.ok ? result.data : undefined;
}

// Tracks human-input pauses and exposes the action that resumes the current run.
export function useWaitingHuman(run: FlowRun | null, flowId: Id) {
    const [isWaitingHuman, setIsWaitingHuman] = useState(false);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [continuing, setContinuing] = useState(false);
    const waitIdRef = useRef<string | null>(null);
    const continueSentWaitIdRef = useRef<string | null>(null);
    const runId = run?.id;
    const runStatus = run?.status;

    useEffect(() => {
        if (runId === undefined) return;
        setIsWaitingHuman(false);
        setValidationMessage(null);
        setContinuing(false);
        waitIdRef.current = null;
        continueSentWaitIdRef.current = null;
    }, [runId]);

    useEffect(() => {
        if (runStatus && runStatus !== 'running') {
            setIsWaitingHuman(false);
            setValidationMessage(null);
            setContinuing(false);
            waitIdRef.current = null;
            continueSentWaitIdRef.current = null;
        }
    }, [runStatus]);

    useWaitStatusPolling({
        runs: runId !== undefined ? [{ id: runId, flowId }] : [],
        active: runStatus === 'running',
        interval: 4000,
        transform: toWaitingState,
        onData: waitingState => {
            if (waitingState === undefined) return;
            if (waitingState.waiting && waitingState.wait_id) {
                waitIdRef.current = waitingState.wait_id;
                setValidationMessage(waitingState.validation_message);
                setIsWaitingHuman(continueSentWaitIdRef.current !== waitingState.wait_id);
            } else {
                waitIdRef.current = null;
                continueSentWaitIdRef.current = null;
                setIsWaitingHuman(false);
                setValidationMessage(null);
            }
        },
    });

    const continueRun = useCallback(async () => {
        const requestedWaitId = waitIdRef.current;
        if (!run || !requestedWaitId) return;

        setContinuing(true);
        continueSentWaitIdRef.current = requestedWaitId;
        try {
            const response = await fetch(`/flows/${flowId}/runs/${run.id}/continue`, {
                method: 'POST',
                headers: {
                    ...csrfHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ wait_id: requestedWaitId }),
            });
            if (!response.ok) {
                throw new Error(`Continue request failed with HTTP ${response.status}.`);
            }
            if (waitIdRef.current === requestedWaitId) {
                setIsWaitingHuman(false);
            }
        } catch {
            if (waitIdRef.current === requestedWaitId) {
                continueSentWaitIdRef.current = null;
                setIsWaitingHuman(true);
            }
        } finally {
            setContinuing(false);
        }
    }, [run, flowId]);

    return { isWaitingHuman, validationMessage, continuing, continueRun };
}
