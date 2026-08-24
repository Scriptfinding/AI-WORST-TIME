import { useMemo } from 'react';
import type { Flow, FlowRun } from '@/Domains/Flow/types';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import {
    extractNodalGraphSnapshot,
    getDisplayCodeSnapshot,
    getRunProgressState,
    getVisibleConsoleLogs,
    getVisualRunProgressState,
} from '@/Domains/Flow/Pages/FlowEditor/Modals/RunDetailModal/runProgress';
import { getRunDetailPreviewFlow } from './utils';

// Chooses and prepares the code snapshot shown for the selected run step.
export function useCodePanePreview(
    run: FlowRun,
    flow?: Flow | FlowRun['flow'],
    visualGraph?: NodalGraph | null,
) {
    const runProgress = useMemo(
        () => getRunProgressState(run.console_logs),
        [run.console_logs],
    );
    const isActiveRun = run.status === 'pending' || run.status === 'running';
    const isErrorRun = run.status === 'error';
    const activeLine = isActiveRun ? runProgress.activeLine : null;
    const errorLine = isErrorRun ? runProgress.activeLine : null;
    const passedLines = useMemo(() => {
        const lines = new Set(runProgress.passedLines);
        if (!isActiveRun && !isErrorRun && runProgress.activeLine != null) {
            lines.add(runProgress.activeLine);
        }

        return Array.from(lines).filter(
            line => line !== activeLine && line !== errorLine,
        );
    }, [
        activeLine,
        errorLine,
        isActiveRun,
        isErrorRun,
        runProgress.activeLine,
        runProgress.passedLines,
    ]);
    const graphSnapshot = useMemo(
        () => extractNodalGraphSnapshot(run.code_snapshot),
        [run.code_snapshot],
    );
    const previewFlow = useMemo(
        () => getRunDetailPreviewFlow(flow ?? run.flow),
        [flow, run.flow],
    );
    const previewGraph = graphSnapshot
        ?? visualGraph
        ?? (previewFlow?.flow_type === 'nodal'
            ? previewFlow.nodal_graph as NodalGraph | null
            : null);
    const visibleConsoleLogs = useMemo(
        () => getVisibleConsoleLogs(run.console_logs),
        [run.console_logs],
    );
    const displayCodeSnapshot = useMemo(
        () => getDisplayCodeSnapshot(run.code_snapshot),
        [run.code_snapshot],
    );
    const visualProgress = useMemo(
        () => getVisualRunProgressState(run.code_snapshot, runProgress),
        [run.code_snapshot, runProgress],
    );

    return {
        activeLine,
        canShowCanvas: Boolean(previewFlow && previewGraph),
        displayCodeSnapshot,
        errorLine,
        isActiveRun,
        isErrorRun,
        passedLines,
        previewFlow,
        previewGraph,
        visibleConsoleLogs,
        visualProgress,
    };
}
