import { useCallback } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { MobileCodeTab, MobileCodeHeader, MobileCodeTitle, MobileCodeCopyButton } from './MobileCodeSnapshot.styled';
import type { Flow, FlowRun } from '@/Domains/Flow/types';
import NodalEditorPane from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodalEditorPane';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { EmptyText, RunListEmpty } from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import CodeSnapshotEditor from './CodePane/components/CodeSnapshotEditor/CodeSnapshotEditor';
import NodalSnapshotFrame from './CodePane/components/NodalSnapshotFrame/NodalSnapshotFrame';
import { useCodePanePreview } from './CodePane/useCodePanePreview';
import { DataPanelLoader } from './shared.styled';

interface MobileCodeSnapshotProps {
    run: FlowRun;
    flow?: Flow | FlowRun['flow'];
    visualGraph?: NodalGraph | null;
    resolvedTheme: string;
    copyToClipboard: (text: string) => void;
}

export default function MobileCodeSnapshot({
    run,
    flow,
    visualGraph,
    resolvedTheme,
    copyToClipboard,
}: MobileCodeSnapshotProps) {
    const preview = useCodePanePreview(run, flow, visualGraph);
    const handleGraphChange = useCallback(() => {}, []);

    return (
        <MobileCodeTab>
            <MobileCodeHeader>
                <MobileCodeTitle>
                    {preview.canShowCanvas ? 'Visual snapshot' : 'Code snapshot'}
                </MobileCodeTitle>
                {preview.displayCodeSnapshot && !preview.canShowCanvas && (
                    <MobileCodeCopyButton
                        onClick={() => copyToClipboard(preview.displayCodeSnapshot!)}
                    >
                        Copy
                    </MobileCodeCopyButton>
                )}
            </MobileCodeHeader>
            {preview.canShowCanvas && preview.previewFlow && preview.previewGraph ? (
                <NodalSnapshotFrame>
                    <NodalEditorPane
                        flow={preview.previewFlow}
                        saved
                        graph={preview.previewGraph}
                        latestRun={run}
                        onGraphChange={handleGraphChange}
                        readOnly
                        allowShortcutsInModal
                        leftView="code"
                        runProgress={{
                            activeNodeId: preview.isActiveRun ? preview.visualProgress.activeNodeId : null,
                            passedNodeIds: preview.isActiveRun || preview.isErrorRun || !preview.visualProgress.activeNodeId
                                ? preview.visualProgress.passedNodeIds
                                : new Set([
                                    ...preview.visualProgress.passedNodeIds,
                                    preview.visualProgress.activeNodeId,
                                ]),
                            nodePassCounts: preview.visualProgress.nodePassCounts,
                            passedEdgeIds: preview.visualProgress.passedEdgeIds,
                            edgePassCounts: preview.visualProgress.edgePassCounts,
                            errorNodeId: preview.isErrorRun ? preview.visualProgress.activeNodeId : null,
                            activeLine: preview.activeLine,
                            passedLines: preview.passedLines,
                            errorLine: preview.errorLine,
                            codeSnapshot: run.code_snapshot,
                        }}
                    />
                </NodalSnapshotFrame>
            ) : run.code_snapshot === undefined ? (
                <DataPanelLoader>
                    <Icon icon="lucide:loader-2" width={18} height={18} />
                </DataPanelLoader>
            ) : run.code_snapshot ? (
                <CodeSnapshotEditor
                    runId={run.id}
                    code={run.code_snapshot}
                    resolvedTheme={resolvedTheme}
                    activeLine={preview.activeLine}
                    passedLines={preview.passedLines}
                    errorLine={preview.errorLine}
                />
            ) : (
                <RunListEmpty><EmptyText>No code snapshot.</EmptyText></RunListEmpty>
            )}
        </MobileCodeTab>
    );
}
