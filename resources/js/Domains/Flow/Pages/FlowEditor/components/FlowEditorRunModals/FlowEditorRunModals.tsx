import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/App/types';
import type { FlowRun } from '@/Domains/Flow/types';
import type { FlowEditorProps } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { buildRerunInput } from '@/Domains/Flow/Hooks/useRunAgainModal/utils';
import RunDetailModal from '@/Domains/Flow/Pages/FlowEditor/Modals/RunDetailModal/RunDetailModal';
import RunModal from '@/Domains/Flow/Pages/FlowEditor/Modals/RunModal/RunModal';
import SaveBeforeRunModal from '@/Domains/Flow/Pages/FlowEditor/Modals/SaveBeforeRunModal/SaveBeforeRunModal';
import ClearRunsModal from '@/Domains/Flow/Pages/FlowEditor/Modals/ClearRunsModal/ClearRunsModal';

interface FlowEditorRunModalsProps {
    flow: FlowEditorProps['flow'];
    runsTotal: number;
    navigationRuns: FlowRun[];
    detailRun: FlowRun | null;
    showRunModal: boolean;
    showSaveBeforeRun: boolean;
    showClearModal: boolean;
    clearing: boolean;
    isNodalFlow: boolean;
    nodalGraph: NodalGraph;
    runInitialInput: string;
    rerunCodeSnapshot: string | null;
    rerunData: string | null;
    copyToClipboard: (text: string) => void;
    onNavigate: (run: FlowRun) => void;
    onCloseRunDetail: () => void;
    onCloseRunModal: () => void;
    onCloseSaveBeforeRun: () => void;
    onCloseClearModal: () => void;
    onRunFromModal: (parsedInput: Record<string, unknown>, useOldCode: boolean) => void;
    onSaveInput: (input: Record<string, unknown>) => void;
    onSaveAndRun: () => void;
    onRunWithoutSaving: () => void;
    onClearAllRuns: () => void;
    onKillRun: (run: FlowRun) => void;
    onRerunFromDetail: (input: string, codeSnapshot: string | null) => void;
}

export default function FlowEditorRunModals({
    flow,
    runsTotal,
    navigationRuns,
    detailRun,
    showRunModal,
    showSaveBeforeRun,
    showClearModal,
    clearing,
    isNodalFlow,
    nodalGraph,
    runInitialInput,
    rerunCodeSnapshot,
    rerunData,
    copyToClipboard,
    onNavigate,
    onCloseRunDetail,
    onCloseRunModal,
    onCloseSaveBeforeRun,
    onCloseClearModal,
    onRunFromModal,
    onSaveInput,
    onSaveAndRun,
    onRunWithoutSaving,
    onClearAllRuns,
    onKillRun,
    onRerunFromDetail,
}: FlowEditorRunModalsProps) {
    const { currentWorkspace } = usePage<PageProps>().props;

    return (
        <>
            <RunDetailModal
                run={detailRun}
                onClose={onCloseRunDetail}
                flowId={flow.id}
                flowName={flow.name}
                flowIcon={flow}
                flow={flow}
                visualGraph={isNodalFlow ? nodalGraph : null}
                timeoutSeconds={flow.timeout_seconds}
                copyToClipboard={copyToClipboard}
                onKill={onKillRun}
                navigationRuns={navigationRuns}
                onNavigate={onNavigate}
                onRerun={detailRun ? (run) => {
                    onRerunFromDetail(buildRerunInput(run, currentWorkspace, flow), run.code_snapshot ?? null);
                } : undefined}
            />

            <RunModal
                flowId={flow.id}
                isNodalFlow={isNodalFlow}
                isOpen={showRunModal}
                onClose={onCloseRunModal}
                initialInput={runInitialInput}
                codeSnapshot={rerunCodeSnapshot}
                rerunData={rerunData}
                onRun={onRunFromModal}
                onSaveInput={onSaveInput}
            />

            <SaveBeforeRunModal
                isOpen={showSaveBeforeRun}
                onClose={onCloseSaveBeforeRun}
                onSaveAndRun={onSaveAndRun}
                onRunWithoutSaving={onRunWithoutSaving}
            />

            <ClearRunsModal
                isOpen={showClearModal}
                totalRuns={runsTotal}
                loading={clearing}
                onClose={onCloseClearModal}
                onConfirm={onClearAllRuns}
            />
        </>
    );
}
