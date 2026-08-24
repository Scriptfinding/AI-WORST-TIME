import type { FlowRun } from '@/Domains/Flow/types';
import type { FlowEditorProps, TabKey } from '@/Domains/Flow/Pages/FlowEditor/types';
import CodeEditorPane from '@/Domains/Flow/Pages/FlowEditor/Panes/CodeEditorPane/CodeEditorPane';
import WelcomePane from '@/Domains/Flow/Pages/FlowEditor/Panes/WelcomePane/WelcomePane';
import NodalEditorPane from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodalEditorPane';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { DraftSaveStatus } from '@/Domains/Flow/Pages/FlowEditor/hooks/useFlowPersistence';
import * as S from './styled';

interface FlowEditorMainPaneProps {
    activeTab: TabKey;
    leftView: 'welcome' | 'code';
    flow: FlowEditorProps['flow'];
    stats: FlowEditorProps['stats'];
    canEdit: boolean;
    isNodalFlow: boolean;
    codeReadOnly: boolean;
    saved: boolean;
    saveStatus: DraftSaveStatus;
    isPublished: boolean;
    publishedVersion: number | null;
    savingPublication: boolean;
    code: string;
    nodalGraph: NodalGraph;
    nodalGraphRevision: number;
    latestNodalRun: FlowRun | null;
    libraryUpdateAvailable: boolean;
    libraryLatestSourceSha: string | null;
    updatingLibrarySource: boolean;
    checkingLibraryUpdate: boolean;
    sidePanelOpen: boolean;
    onSwitchToCode: () => void;
    onSwitchToSettings: () => void;
    onToggleSidePanel: () => void;
    onGraphChange: (graph: NodalGraph) => void;
    onCodeChange: (code: string | undefined) => void;
    onSave: () => void;
    onPublish: () => void;
    onUnpublish: () => void;
    onViewTimeline: () => void;
    onRun: () => void;
    onResetToDefault: () => void;
    onUpdateLibrarySource?: () => void;
    onCheckLibraryUpdate?: () => void;
    onOpenLibraryStore: () => void;
    onDownloadFlow: () => void;
    onDuplicateFlow: () => void;
    onSwitchView: (view: 'welcome' | 'code') => void;
}

export default function FlowEditorMainPane({
    activeTab,
    leftView,
    flow,
    stats,
    canEdit,
    isNodalFlow,
    codeReadOnly,
    saved,
    saveStatus,
    isPublished,
    publishedVersion,
    savingPublication,
    code,
    nodalGraph,
    nodalGraphRevision,
    latestNodalRun,
    libraryUpdateAvailable,
    libraryLatestSourceSha,
    updatingLibrarySource,
    checkingLibraryUpdate,
    sidePanelOpen,
    onSwitchToCode,
    onSwitchToSettings,
    onToggleSidePanel,
    onGraphChange,
    onCodeChange,
    onSave,
    onPublish,
    onUnpublish,
    onViewTimeline,
    onRun,
    onResetToDefault,
    onUpdateLibrarySource,
    onCheckLibraryUpdate,
    onOpenLibraryStore,
    onDownloadFlow,
    onDuplicateFlow,
    onSwitchView,
}: FlowEditorMainPaneProps) {
    const flowWithLibraryStatus = {
        ...flow,
        is_published: isPublished,
        library_update_available: libraryUpdateAvailable,
        library_latest_source_sha: libraryLatestSourceSha,
    };

    return (
        <S.LeftColumn $hidden={activeTab !== 'code'}>
            {leftView === 'welcome' ? (
                <WelcomePane
                    flow={flow}
                    stats={stats}
                    canEdit={canEdit}
                    onSwitchToCode={onSwitchToCode}
                    onSwitchToSettings={onSwitchToSettings}
                    sidePanelOpen={sidePanelOpen}
                    onToggleSidePanel={onToggleSidePanel}
                />
            ) : isNodalFlow ? (
                <NodalEditorPane
                    key={`${flow.id}:${nodalGraphRevision}`}
                    flow={flowWithLibraryStatus}
                    saved={saved}
                    graph={nodalGraph}
                    graphRevision={nodalGraphRevision}
                    latestRun={latestNodalRun}
                    onGraphChange={onGraphChange}
                    onSave={onSave}
                    saveStatus={saveStatus}
                    publishedVersion={publishedVersion}
                    onPublish={onPublish}
                    onUnpublish={onUnpublish}
                    onViewTimeline={onViewTimeline}
                    savingPublication={savingPublication}
                    publicationEditable={canEdit}
                    onRun={onRun}
                    onOpenLibraryStore={onOpenLibraryStore}
                    onDownloadFlow={onDownloadFlow}
                    onDuplicateFlow={onDuplicateFlow}
                    readOnly={codeReadOnly}
                    leftView={leftView}
                    onSwitchView={onSwitchView}
                    sidePanelOpen={sidePanelOpen}
                    onToggleSidePanel={onToggleSidePanel}
                />
            ) : (
                <CodeEditorPane
                    flow={flowWithLibraryStatus}
                    code={code}
                    saved={saved}
                    hidden={false}
                    onCodeChange={onCodeChange}
                    onSave={onSave}
                    saveStatus={saveStatus}
                    publishedVersion={publishedVersion}
                    onPublish={onPublish}
                    onUnpublish={onUnpublish}
                    onViewTimeline={onViewTimeline}
                    savingPublication={savingPublication}
                    publicationEditable={canEdit}
                    onRun={onRun}
                    onResetToDefault={onResetToDefault}
                    onUpdateLibrarySource={onUpdateLibrarySource}
                    updatingLibrarySource={updatingLibrarySource}
                    onCheckLibraryUpdate={onCheckLibraryUpdate}
                    checkingLibraryUpdate={checkingLibraryUpdate}
                    onOpenLibraryStore={onOpenLibraryStore}
                    onDownloadFlow={onDownloadFlow}
                    onDuplicateFlow={onDuplicateFlow}
                    readOnly={codeReadOnly}
                    leftView={leftView}
                    onSwitchView={onSwitchView}
                    sidePanelOpen={sidePanelOpen}
                    onToggleSidePanel={onToggleSidePanel}
                />
            )}
        </S.LeftColumn>
    );
}
