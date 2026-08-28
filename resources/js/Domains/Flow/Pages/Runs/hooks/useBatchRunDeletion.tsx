import { useCallback, useState } from 'react';
import { router } from '@inertiajs/react';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import {
    ConfirmFlowItem,
    ConfirmFlowList,
    ConfirmationFlowItemLabel,
    useConfirm,
} from '@/Shared/Hooks/useConfirm';
import type { FlowRun } from '@/Domains/Flow/types';

// Confirms and submits bulk run deletion while keeping selection in sync.
export function useBatchRunDeletion(removeRunIdsFromSelection: (ids: number[]) => void) {
    const { confirm, ConfirmModal } = useConfirm();
    const [deletingSelected, setDeletingSelected] = useState(false);

    const deleteSelectedRuns = useCallback(async (runsToDelete: FlowRun[]) => {
        if (runsToDelete.length === 0) return;
        const selectedHasActiveRuns = runsToDelete.some(run => run.status === 'pending' || run.status === 'running');
        const ok = await confirm({
            title: runsToDelete.length === 1 ? 'Delete Run' : 'Delete Runs',
            confirmLabel: `Delete (${runsToDelete.length})`,
            variant: 'danger',
            message: (
                <>
                    <div>
                        Delete {runsToDelete.length === 1 ? 'this run' : `these ${runsToDelete.length} runs`}? This action cannot be undone.
                    </div>
                    {selectedHasActiveRuns && <div style={{ marginTop: 8 }}>Active runs will be stopped before deletion.</div>}
                    <ConfirmFlowList>
                        {runsToDelete.map(run => (
                            <ConfirmFlowItem key={run.id} as="div">
                                <ConfirmationFlowItemLabel>
                                    {run.flow && <FlowIcon flow={run.flow} size={16} radius="xs" />}
                                    <span>#{run.id} - {run.flow?.name || 'Unknown flow'}</span>
                                </ConfirmationFlowItemLabel>
                            </ConfirmFlowItem>
                        ))}
                    </ConfirmFlowList>
                </>
            ),
        });
        if (!ok) return;

        setDeletingSelected(true);
        const deletedIds = runsToDelete.map(run => run.id);
        router.delete('/flows/runs/batch-delete', {
            data: { ids: deletedIds },
            preserveScroll: true,
            onSuccess: () => {
                removeRunIdsFromSelection(deletedIds);
            },
            onFinish: () => setDeletingSelected(false),
        });
    }, [confirm, removeRunIdsFromSelection]);

    return { deletingSelected, deleteSelectedRuns, ConfirmModal };
}
