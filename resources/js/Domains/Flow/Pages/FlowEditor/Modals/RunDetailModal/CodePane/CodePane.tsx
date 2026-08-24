import { useCallback } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import ConsoleLogView from '@/Domains/Flow/Pages/FlowEditor/components/ConsoleLogView/ConsoleLogView';
import NodalEditorPane from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodalEditorPane';
import { EmptyText, RunListEmpty } from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import CodeSnapshotEditor from './components/CodeSnapshotEditor/CodeSnapshotEditor';
import NodalSnapshotFrame from './components/NodalSnapshotFrame/NodalSnapshotFrame';
import {
    ConsolePanel,
    ConsolePanelContent,
    ConsoleResizeHandle,
    ConsoleToggle,
    CopyButton,
    Loader,
    PanelHeader,
    PanelTitle,
} from './styled';
import type { CodePaneProps } from './types';
import { useCodePanePreview } from './useCodePanePreview';

export default function CodePane({ run, flow, visualGraph, resolvedTheme, consoleOpen, consoleHeight, copyToClipboard, onToggleConsole, onConsoleResizeStart }: CodePaneProps) {
    const {
        activeLine,
        canShowCanvas,
        displayCodeSnapshot,
        errorLine,
        isActiveRun,
        isErrorRun,
        passedLines,
        previewFlow,
        previewGraph,
        visibleConsoleLogs,
        visualProgress,
    } = useCodePanePreview(run, flow, visualGraph);
    const handlePreviewGraphChange = useCallback(() => {}, []);

    return (
        <>
            <PanelHeader>
                <PanelTitle>{canShowCanvas ? 'Visual snapshot' : 'Code snapshot'}</PanelTitle>
                {displayCodeSnapshot && !canShowCanvas && (
                    <CopyButton onClick={() => copyToClipboard(displayCodeSnapshot)}>Copy</CopyButton>
                )}
            </PanelHeader>
            {canShowCanvas && previewFlow && previewGraph ? (
                <NodalSnapshotFrame flatBottom>
                    <NodalEditorPane
                        flow={previewFlow}
                        saved
                        graph={previewGraph}
                        latestRun={run}
                        onGraphChange={handlePreviewGraphChange}
                        readOnly
                        allowShortcutsInModal
                        leftView="code"
                        runProgress={{
                            activeNodeId: isActiveRun ? visualProgress.activeNodeId : null,
                            passedNodeIds: isActiveRun || isErrorRun || !visualProgress.activeNodeId
                                ? visualProgress.passedNodeIds
                                : new Set([...visualProgress.passedNodeIds, visualProgress.activeNodeId]),
                            nodePassCounts: visualProgress.nodePassCounts,
                            errorNodeId: isErrorRun ? visualProgress.activeNodeId : null,
                            activeLine,
                            passedLines,
                            errorLine,
                            codeSnapshot: run.code_snapshot,
                        }}
                    />
                </NodalSnapshotFrame>
            ) : run.code_snapshot === undefined ? (
                <Loader><Icon icon="lucide:loader-2" width={18} height={18} /></Loader>
            ) : run.code_snapshot ? (
                <CodeSnapshotEditor
                    code={run.code_snapshot}
                    resolvedTheme={resolvedTheme}
                    activeLine={activeLine}
                    passedLines={passedLines}
                    errorLine={errorLine}
                    flatBottom
                />
            ) : (
                <RunListEmpty><EmptyText>No code snapshot.</EmptyText></RunListEmpty>
            )}
            {consoleOpen && <ConsoleResizeHandle onMouseDown={onConsoleResizeStart} />}
            <ConsoleToggle $open={consoleOpen} onClick={() => onToggleConsole(!consoleOpen)}>
                <Icon icon="lucide:chevron-right" width={12} height={12} />
                Console
                {visibleConsoleLogs.length > 0 && (
                    <> ({visibleConsoleLogs.length})</>
                )}
            </ConsoleToggle>
            {consoleOpen && (
                <ConsolePanel $height={consoleHeight}>
                    <ConsolePanelContent>
                        {visibleConsoleLogs.length > 0 ? (
                            <ConsoleLogView logs={visibleConsoleLogs} onCopy={copyToClipboard} />
                        ) : (
                            <RunListEmpty><EmptyText>No console logs.</EmptyText></RunListEmpty>
                        )}
                    </ConsolePanelContent>
                </ConsolePanel>
            )}
        </>
    );
}
