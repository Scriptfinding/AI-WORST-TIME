import React, { useCallback, useMemo, useRef } from 'react';
import { useCodeHelpPanel } from '@/Shared/CodeEditor/hooks/useCodeHelpPanel';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import { getMissingAwaitCalls } from '@/Domains/Flow/Pages/FlowEditor/utils/missingAwaits';
import { EditorToolbar } from './components/EditorToolbar/EditorToolbar';
import { EvaluationModal } from './components/EvaluationModal/EvaluationModal';
import { MissingAwaitBanner } from './components/MissingAwaitBanner/MissingAwaitBanner';
import {
    MonacoWorkspace,
    type MonacoWorkspaceHandle,
} from './components/MonacoWorkspace/MonacoWorkspace';
import { SourceBanner } from './components/SourceBanner/SourceBanner';
import { ToolboxPanel } from './components/ToolboxPanel/ToolboxPanel';
import type { CodeEditorPaneProps } from './types';
import * as S from './styled';

function CodeEditorPane({
    flow,
    code,
    saved,
    hidden,
    onCodeChange,
    onSave,
    saveStatus,
    publishedVersion,
    onPublish,
    onUnpublish,
    onViewTimeline,
    savingPublication,
    publicationEditable,
    onRun,
    onResetToDefault,
    onUpdateLibrarySource,
    updatingLibrarySource = false,
    onCheckLibraryUpdate,
    checkingLibraryUpdate = false,
    onOpenLibraryStore,
    onDownloadFlow,
    onDuplicateFlow,
    readOnly = false,
    leftView = 'code',
    onSwitchView,
    sidePanelOpen,
    onToggleSidePanel,
}: CodeEditorPaneProps) {
    const workspaceRef = useRef<MonacoWorkspaceHandle>(null);
    const missingAwaitCalls = useMemo(
        () => readOnly ? [] : getMissingAwaitCalls(code),
        [code, readOnly],
    );

    const insertEntry = useCallback(
        (entry: HelpEntryDef) => workspaceRef.current?.insertHelpEntry(entry) ?? false,
        [],
    );
    const fixMissingAwaits = useCallback(() => {
        workspaceRef.current?.fixMissingAwaits();
    }, []);
    const help = useCodeHelpPanel({ readOnly, insertEntry });

    return (
        <S.EditorWrapper $hidden={hidden}>
            <S.CodeColumn>
                <EditorToolbar
                    flowName={flow.name}
                    saved={saved}
                    readOnly={readOnly}
                    leftView={leftView}
                    sidePanelOpen={sidePanelOpen}
                    onSave={onSave}
                    isPublished={flow.is_published}
                    publishedVersion={publishedVersion}
                    saveStatus={saveStatus}
                    onPublish={onPublish}
                    onUnpublish={onUnpublish}
                    onViewTimeline={onViewTimeline}
                    savingPublication={savingPublication}
                    publicationEditable={publicationEditable}
                    onSwitchView={onSwitchView}
                    onOpenLibraryStore={onOpenLibraryStore}
                    onDownloadFlow={onDownloadFlow}
                    onDuplicateFlow={onDuplicateFlow}
                    onResetToDefault={onResetToDefault}
                    onToggleSidePanel={onToggleSidePanel}
                />
                {flow.library_locked && (
                    <SourceBanner
                        updateAvailable={Boolean(flow.library_update_available)}
                        updating={updatingLibrarySource}
                        checking={checkingLibraryUpdate}
                        onUpdate={onUpdateLibrarySource}
                        onCheck={onCheckLibraryUpdate}
                    />
                )}
                {missingAwaitCalls.length > 0 && (
                    <MissingAwaitBanner
                        calls={missingAwaitCalls}
                        onFixAll={fixMissingAwaits}
                    />
                )}
                <MonacoWorkspace
                    ref={workspaceRef}
                    code={code}
                    defaultInputs={flow.default_inputs}
                    flowId={flow.id}
                    readOnly={readOnly}
                    onCodeChange={onCodeChange}
                    onGizmoClick={help.focusEntry}
                    onOpenHelp={help.openHelp}
                    onRun={onRun}
                />
            </S.CodeColumn>
            {help.showHelp && (
                <ToolboxPanel
                    search={help.search}
                    activeCategoryKey={help.activeCategoryKey}
                    activeIndex={help.activeIndex}
                    entries={help.entries}
                    entryRefs={help.entryRefs}
                    onSearchChange={help.setSearch}
                    onSearchKeyDown={help.handleSearchKeyDown}
                    onCategoryChange={help.setActiveCategoryKey}
                    onActiveIndexChange={help.setActiveIndex}
                    onInsert={help.insert}
                    onEvaluate={help.evaluate}
                    onClose={help.closeHelp}
                />
            )}
            {help.evaluation && (
                <EvaluationModal
                    evaluation={help.evaluation}
                    onClose={help.closeEvaluation}
                />
            )}
        </S.EditorWrapper>
    );
}

export default React.memo(CodeEditorPane, (previous, next) =>
    previous.flow.id === next.flow.id
    && previous.flow.name === next.flow.name
    && previous.flow.default_inputs === next.flow.default_inputs
    && previous.flow.library_locked === next.flow.library_locked
    && previous.flow.library_update_available === next.flow.library_update_available
    && previous.flow.is_published === next.flow.is_published
    && previous.code === next.code
    && previous.saved === next.saved
    && previous.hidden === next.hidden
    && previous.updatingLibrarySource === next.updatingLibrarySource
    && previous.checkingLibraryUpdate === next.checkingLibraryUpdate
    && previous.readOnly === next.readOnly
    && previous.leftView === next.leftView
    && previous.sidePanelOpen === next.sidePanelOpen
    && previous.onCodeChange === next.onCodeChange
    && previous.onSave === next.onSave
    && previous.saveStatus === next.saveStatus
    && previous.publishedVersion === next.publishedVersion
    && previous.onPublish === next.onPublish
    && previous.onUnpublish === next.onUnpublish
    && previous.onViewTimeline === next.onViewTimeline
    && previous.savingPublication === next.savingPublication
    && previous.publicationEditable === next.publicationEditable
    && previous.onRun === next.onRun
    && previous.onResetToDefault === next.onResetToDefault
    && previous.onUpdateLibrarySource === next.onUpdateLibrarySource
    && previous.onCheckLibraryUpdate === next.onCheckLibraryUpdate
    && previous.onOpenLibraryStore === next.onOpenLibraryStore
    && previous.onDownloadFlow === next.onDownloadFlow
    && previous.onDuplicateFlow === next.onDuplicateFlow
    && previous.onSwitchView === next.onSwitchView
    && previous.onToggleSidePanel === next.onToggleSidePanel
);
