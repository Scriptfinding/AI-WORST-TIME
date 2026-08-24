import { Icon } from '@/Shared/UI/Icon/Icon';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import LibraryStoreModal from '@/Domains/Library/Components/LibraryStoreModal/LibraryStoreModal';
import VisibilityModal from '@/Domains/Flow/Components/VisibilityModal/VisibilityModal';
import Breadcrumbs from '../../Breadcrumbs/Breadcrumbs';
import type { FlowEditorProps } from '../../types';
import type { FlowEditorController } from '../../hooks/useFlowEditorController';
import DuplicateFlowModal from '../DuplicateFlowModal/DuplicateFlowModal';
import FlowEditorHeaderActions from '../FlowEditorHeaderActions/FlowEditorHeaderActions';
import FlowEditorMainPane from '../FlowEditorMainPane/FlowEditorMainPane';
import FlowEditorMobileNav from '../FlowEditorMobileNav/FlowEditorMobileNav';
import FlowEditorRunModals from '../FlowEditorRunModals/FlowEditorRunModals';
import FlowEditorSidePanel from '../FlowEditorSidePanel/FlowEditorSidePanel';
import VersionTimelineModal from '../../Modals/VersionTimelineModal/VersionTimelineModal';
import * as S from './styled';

interface FlowEditorViewProps extends FlowEditorProps {
    controller: FlowEditorController;
}

export default function FlowEditorView({
    controller: c,
    flow,
    stats,
    breadcrumbs,
    siblingFlows,
    canEdit,
    workspaceProxies,
    personalTree,
    myTriggers,
    myActions,
    otherTriggers,
    otherActions,
    teams = [],
    repositoryIntegrations,
    triggerGroups = [],
    actionGroups = [],
    mailboxWatchers,
    watcherGroups = [],
    mailboxes,
    workspaceTree,
    teamTrees = [],
}: FlowEditorViewProps) {
    return (
        <AppLayout
            noPadding
            title={
                <S.TitleBlock>
                    <Breadcrumbs breadcrumbs={breadcrumbs} flow={flow} siblingFlows={siblingFlows} />
                </S.TitleBlock>
            }
            headerRight={
                <FlowEditorHeaderActions
                    flow={flow}
                    canEdit={canEdit}
                    running={c.running}
                    showOverflow={c.showOverflow}
                    overflowRef={c.overflowRef}
                    visibilityColor={c.visibilityColor}
                    onRun={() => c.openRunModal()}
                    onOpenVisibility={() => c.setShowVisibilityModal(true)}
                    onToggleOverflow={() => c.setShowOverflow(value => !value)}
                    onCloseOverflow={() => c.setShowOverflow(false)}
                />
            }
        >
            {c.conflictVersion && (
                <S.ExternalUpdateBanner>
                    <S.ExternalUpdateContent>
                        <Icon icon="lucide:triangle-alert" width={18} />
                        <div>
                            <S.ExternalUpdateTitle>Flow modified elsewhere</S.ExternalUpdateTitle>
                            <S.ExternalUpdateMessage>
                                A newer saved version exists. Editing is locked until you refresh or save your current version.
                            </S.ExternalUpdateMessage>
                        </div>
                    </S.ExternalUpdateContent>
                    <S.ExternalUpdateActions>
                        <S.ExternalUpdateButton
                            type="button"
                            onClick={c.handleRefreshLatestFlowVersion}
                            disabled={c.resolvingConflict !== null}
                        >
                            {c.resolvingConflict === 'refresh' ? 'Refreshing...' : 'Refresh latest'}
                        </S.ExternalUpdateButton>
                        <S.ExternalUpdateButton
                            type="button"
                            $primary
                            onClick={c.handleKeepCurrentFlowVersion}
                            disabled={c.resolvingConflict !== null}
                        >
                            {c.resolvingConflict === 'save' ? 'Saving...' : 'Save current version'}
                        </S.ExternalUpdateButton>
                    </S.ExternalUpdateActions>
                </S.ExternalUpdateBanner>
            )}

            <S.Container ref={c.editorContainerRef}>
                <FlowEditorMainPane
                    activeTab={c.activeTab}
                    leftView={c.leftView}
                    flow={flow}
                    stats={stats}
                    canEdit={canEdit}
                    isNodalFlow={c.isNodalFlow}
                    codeReadOnly={c.codeReadOnly}
                    saved={c.saved}
                    saveStatus={c.saveStatus}
                    isPublished={c.isPublished}
                    publishedVersion={c.publishedVersion}
                    savingPublication={c.savingPublication}
                    code={c.code}
                    nodalGraph={c.nodalGraph}
                    nodalGraphRevision={c.nodalGraphRevision}
                    latestNodalRun={c.latestNodalRun}
                    libraryUpdateAvailable={c.libraryUpdateAvailable}
                    libraryLatestSourceSha={c.libraryLatestSourceSha}
                    updatingLibrarySource={c.updatingLibrarySource}
                    checkingLibraryUpdate={c.checkingLibraryUpdate}
                    sidePanelOpen={c.sidePanelOpen}
                    onSwitchToCode={c.switchToCode}
                    onSwitchToSettings={c.switchToSettings}
                    onToggleSidePanel={c.toggleSidePanel}
                    onGraphChange={c.setNodalGraph}
                    onCodeChange={c.handleCodeChange}
                    onSave={c.handleSaveCode}
                    onPublish={c.handlePublish}
                    onUnpublish={c.handleUnpublish}
                    onViewTimeline={() => {
                        c.setTimelineVersionId(null);
                        c.setShowVersionTimeline(true);
                    }}
                    onRun={() => c.openRunModal()}
                    onResetToDefault={c.handleResetToDefault}
                    onUpdateLibrarySource={c.libraryUpdateAvailable ? c.handleUpdateLibrarySource : undefined}
                    onCheckLibraryUpdate={flow.library_locked ? c.handleCheckLibraryUpdate : undefined}
                    onOpenLibraryStore={c.handleLibraryStoreOpen}
                    onDownloadFlow={c.handleDownloadFlow}
                    onDuplicateFlow={c.openDuplicateModal}
                    onSwitchView={c.changeLeftView}
                />

                {c.sidePanelOpen && (
                    <S.SidePanelResizeHandle
                        onMouseDown={c.handleSidePanelResizeStart}
                        title="Resize side panel"
                    />
                )}
                <FlowEditorSidePanel
                    sideTab={c.sideTab}
                    activeTab={c.activeTab}
                    sidePanelOpen={c.sidePanelOpen}
                    sidePanelWidth={c.sidePanelWidth}
                    canEdit={canEdit}
                    workspaceProxies={workspaceProxies}
                    isNodalFlow={c.isNodalFlow}
                    flow={flow}
                    runs={c.runs}
                    running={c.running}
                    clearing={c.clearing}
                    myTriggers={myTriggers}
                    otherTriggers={otherTriggers}
                    myActions={myActions}
                    otherActions={otherActions}
                    teams={teams}
                    triggerGroups={triggerGroups}
                    actionGroups={actionGroups}
                    mailboxWatchers={mailboxWatchers}
                    watcherGroups={watcherGroups}
                    mailboxes={mailboxes}
                    repositoryIntegrations={repositoryIntegrations}
                    settingsScrollToRef={c.settingsScrollToRef}
                    defaultInputsSaveRef={c.defaultInputsSaveRef}
                    onSwitchTab={c.handleSwitchTab}
                    onSettingsDirtyChange={c.handleSettingsDirtyChange}
                    onViewRunDetails={c.handleViewRunDetails}
                    onCopyToClipboard={c.copyToClipboard}
                    onRunNow={() => c.openRunModal()}
                    onKillRun={c.handleKillRun}
                    onClearAll={c.openClearModal}
                    onDeleteSelected={c.handleDeleteSelectedRuns}
                />

                <FlowEditorMobileNav
                    activeTab={c.activeTab}
                    canEdit={canEdit}
                    isNodalFlow={c.isNodalFlow}
                    onSwitchTab={c.handleSwitchTab}
                />
            </S.Container>

            <FlowEditorRunModals
                flow={flow}
                runsTotal={c.runs.total}
                navigationRuns={c.runs.data}
                detailRun={c.detailRun}
                showRunModal={c.showRunModal}
                showSaveBeforeRun={c.showSaveBeforeRun}
                showClearModal={c.showClearModal}
                clearing={c.clearing}
                isNodalFlow={c.isNodalFlow}
                nodalGraph={c.nodalGraph}
                runInitialInput={c.runInitialInput}
                rerunCodeSnapshot={c.rerunCodeSnapshot}
                rerunData={c.rerunData}
                copyToClipboard={c.copyToClipboard}
                onNavigate={c.handleViewRunDetails}
                onCloseRunDetail={c.handleCloseRunDetail}
                onCloseRunModal={c.closeRunModal}
                onCloseSaveBeforeRun={c.closeSaveBeforeRun}
                onCloseClearModal={c.closeClearModal}
                onRunFromModal={c.handleRunFromModal}
                onSaveInput={c.handleSaveInput}
                onSaveAndRun={c.handleSaveAndRun}
                onRunWithoutSaving={c.handleRunWithoutSaving}
                onClearAllRuns={c.handleClearAllRuns}
                onKillRun={c.handleKillRun}
                onRerunFromDetail={c.handleRerunFromDetail}
            />

            <LibraryStoreModal
                isOpen={c.showLibraryStore}
                onClose={() => c.setShowLibraryStore(false)}
                teams={teams}
            />

            <DuplicateFlowModal
                isOpen={c.showDuplicateModal}
                loading={c.duplicatingFlow}
                form={c.duplicateForm}
                errors={c.duplicateErrors}
                visibility={c.duplicateVisibility}
                personalTree={personalTree}
                workspaceTree={workspaceTree}
                teamTrees={teamTrees}
                onClose={c.closeDuplicateModal}
                onSubmit={c.submitDuplicateFlow}
                onFormChange={c.setDuplicateForm}
                onVisibilityChange={c.setDuplicateVisibility}
            />

            <VersionTimelineModal
                flow={{ ...flow, is_published: c.isPublished }}
                canEdit={canEdit}
                isOpen={c.showVersionTimeline}
                initialVersionId={c.timelineVersionId}
                getDraftUpdatedAt={c.getDraftUpdatedAt}
                onClose={() => c.setShowVersionTimeline(false)}
                onRestored={() => window.location.reload()}
                onVersionPublished={c.handleHistoricalVersionPublished}
            />

            <c.ConfirmModal />

            {canEdit && (
                <VisibilityModal
                    isOpen={c.showVisibilityModal}
                    onClose={() => c.setShowVisibilityModal(false)}
                    onConfirm={c.handleVisibilityConfirm}
                    flow={flow}
                    personalTree={personalTree}
                    workspaceTree={workspaceTree}
                    teamTrees={teamTrees}
                    loading={c.savingVisibility}
                />
            )}
        </AppLayout>
    );
}
