import React, { useCallback, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import type { PageProps } from '@/App/types';
import type { FlowRun } from '@/Domains/Flow/types';
import RunAgainModal from './useRunAgainModal/RunAgainModal';
import { buildRerunInput } from './useRunAgainModal/utils';

// Manages the modal state and request payload for rerunning a completed flow.
export function useRunAgainModal() {
    const { currentWorkspace } = usePage<PageProps>().props;
    const [showRunModal, setShowRunModal] = useState(false);
    const [rerunFlowId, setRerunFlowId] = useState<Id | null>(null);
    const [rerunIsNodalFlow, setRerunIsNodalFlow] = useState(false);
    const [rerunCodeSnapshot, setRerunCodeSnapshot] = useState<string | null>(null);
    const [rerunData, setRerunData] = useState<string | null>(null);

    const openRunAgainModal = useCallback((run: FlowRun) => {
        if (!run.flow) return;

        setRerunFlowId(run.flow.id);
        setRerunIsNodalFlow(run.flow.flow_type === 'nodal');
        setRerunCodeSnapshot(run.code_snapshot ?? null);
        setRerunData(buildRerunInput(run, currentWorkspace, run.flow));
        setShowRunModal(true);
    }, [currentWorkspace]);

    const handleRunFromModal = useCallback((parsedInput: Record<string, unknown>, useOldCode: boolean) => {
        if (!rerunFlowId) return;

        setShowRunModal(false);
        const payload: Record<string, unknown> = {
            input: parsedInput,
            is_rerun: true,
        };

        if (useOldCode && rerunCodeSnapshot) {
            payload.code_override = rerunCodeSnapshot;
        }

        router.post(`/flows/${rerunFlowId}/run`, payload as Parameters<typeof router.post>[1], {
            preserveState: true,
            preserveScroll: true,
        });
    }, [rerunCodeSnapshot, rerunFlowId]);

    const runAgainModal = rerunFlowId ? (
        <RunAgainModal
            flowId={rerunFlowId}
            isNodalFlow={rerunIsNodalFlow}
            isOpen={showRunModal}
            onClose={() => setShowRunModal(false)}
            codeSnapshot={rerunCodeSnapshot}
            rerunData={rerunData}
            onRun={handleRunFromModal}
        />
    ) : null;

    return { openRunAgainModal, runAgainModal };
}
