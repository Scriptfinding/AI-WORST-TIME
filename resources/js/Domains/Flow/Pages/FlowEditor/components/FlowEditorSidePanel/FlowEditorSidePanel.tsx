import type React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { usePageProps } from '@/App/Hooks/usePageProps';
import type { FlowRun } from '@/Domains/Flow/types';
import type { FlowEditorProps, TabKey } from '@/Domains/Flow/Pages/FlowEditor/types';
import InfoPane from '@/Domains/Flow/Pages/FlowEditor/Panes/InfoPane/InfoPane';
import TriggersPane from '@/Domains/Flow/Pages/FlowEditor/Panes/TriggersPane/TriggersPane';
import ActionsPane from '@/Domains/Flow/Pages/FlowEditor/Panes/ActionsPane/ActionsPane';
import RunsPane from '@/Domains/Flow/Pages/FlowEditor/Panes/RunsPane/RunsPane';
import MailboxesPane from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/MailboxesPane';
import SettingsPane from '@/Domains/Flow/Pages/FlowEditor/Panes/SettingsPane/SettingsPane';
import RepositoryPane from '@proprietary/Domains/Flow/Pages/FlowEditor/Panes/RepositoryPane/RepositoryPane.pp';
import * as S from './styled';

interface FlowEditorSidePanelProps {
    sideTab: TabKey;
    activeTab: TabKey;
    sidePanelOpen: boolean;
    sidePanelWidth: number;
    canEdit: boolean;
    workspaceProxies: FlowEditorProps['workspaceProxies'];
    isNodalFlow: boolean;
    flow: FlowEditorProps['flow'];
    runs: FlowEditorProps['runs'];
    running: boolean;
    clearing: boolean;
    myTriggers: FlowEditorProps['myTriggers'];
    otherTriggers: FlowEditorProps['otherTriggers'];
    myActions: FlowEditorProps['myActions'];
    otherActions: FlowEditorProps['otherActions'];
    teams: FlowEditorProps['teams'];
    triggerGroups: FlowEditorProps['triggerGroups'];
    actionGroups: FlowEditorProps['actionGroups'];
    mailboxWatchers: FlowEditorProps['mailboxWatchers'];
    watcherGroups: FlowEditorProps['watcherGroups'];
    mailboxes: FlowEditorProps['mailboxes'];
    repositoryIntegrations: FlowEditorProps['repositoryIntegrations'];
    settingsScrollToRef: React.MutableRefObject<string | null>;
    defaultInputsSaveRef: React.MutableRefObject<(() => void) | null>;
    onSwitchTab: (tab: TabKey) => void;
    onSettingsDirtyChange: (isDirty: boolean) => void;
    onViewRunDetails: (run: FlowRun) => void;
    onCopyToClipboard: (text: string) => void;
    onRunNow: () => void;
    onKillRun: (run: FlowRun) => void;
    onClearAll: () => void;
    onDeleteSelected: (ids: number[]) => void;
}

export default function FlowEditorSidePanel({
    sideTab,
    activeTab,
    sidePanelOpen,
    sidePanelWidth,
    canEdit,
    workspaceProxies,
    isNodalFlow,
    flow,
    runs,
    running,
    clearing,
    myTriggers,
    otherTriggers,
    myActions,
    otherActions,
    teams,
    triggerGroups,
    actionGroups,
    mailboxWatchers,
    watcherGroups,
    mailboxes,
    repositoryIntegrations,
    settingsScrollToRef,
    defaultInputsSaveRef,
    onSwitchTab,
    onSettingsDirtyChange,
    onViewRunDetails,
    onCopyToClipboard,
    onRunNow,
    onKillRun,
    onClearAll,
    onDeleteSelected,
}: FlowEditorSidePanelProps) {
    const { settings } = usePageProps();
    const showRepository = canEdit && settings.vcs_enabled;

    return (
        <S.SidePanel
            $hidden={!sidePanelOpen}
            $mobileVisible={activeTab !== 'code'}
            $width={sidePanelWidth}
        >
            <S.TabBar>
                <S.Tab $active={sideTab === 'info'} onClick={() => onSwitchTab('info')}>
                    <Icon icon="lucide:database" width={13} height={13} />
                    Data
                </S.Tab>
                <S.Tab $active={sideTab === 'runs'} onClick={() => onSwitchTab('runs')}>
                    <Icon icon="lucide:play" width={13} height={13} />
                    Runs
                </S.Tab>
                <S.Tab $active={sideTab === 'automation'} onClick={() => onSwitchTab('automation')}>
                    <Icon icon="lucide:bot" width={13} height={13} />
                    <S.TabLabelFull>Automation</S.TabLabelFull>
                    <S.TabLabelShort>Autom.</S.TabLabelShort>
                </S.Tab>
                <S.Tab $active={sideTab === 'mailboxes'} onClick={() => onSwitchTab('mailboxes')}>
                    <Icon icon="lucide:mail-search" width={13} height={13} />
                    <S.TabLabelFull>Mailboxes</S.TabLabelFull>
                    <S.TabLabelShort>Mails</S.TabLabelShort>
                </S.Tab>
                {showRepository && (
                    <S.Tab $active={sideTab === 'repository'} onClick={() => onSwitchTab('repository')}>
                        <Icon icon="lucide:git-branch" width={13} height={13} />
                        Git
                    </S.Tab>
                )}
                {canEdit && (
                    <S.Tab $active={sideTab === 'settings'} onClick={() => onSwitchTab('settings')}>
                        <Icon icon="lucide:settings" width={13} height={13} />
                        Settings
                    </S.Tab>
                )}
            </S.TabBar>

            {sideTab === 'info' && (
                <S.InfoScrollPane>
                    <InfoPane
                        flow={flow}
                        canEdit={canEdit}
                        onViewRunDetails={onViewRunDetails}
                        onKillRun={onKillRun}
                        copyToClipboard={onCopyToClipboard}
                        defaultInputsSaveRef={defaultInputsSaveRef}
                    />
                </S.InfoScrollPane>
            )}
            {sideTab === 'automation' && (
                <S.SplitPane>
                    <S.SplitPaneHalf>
                        <TriggersPane
                            flowId={flow.id}
                            triggers={myTriggers}
                            otherTriggers={otherTriggers}
                            teams={teams}
                            groups={triggerGroups}
                        />
                    </S.SplitPaneHalf>
                    <S.SplitPaneDivider />
                    <S.SplitPaneHalf>
                        <ActionsPane
                            flowId={flow.id}
                            actions={myActions}
                            otherActions={otherActions}
                            teams={teams}
                            groups={actionGroups}
                        />
                    </S.SplitPaneHalf>
                </S.SplitPane>
            )}
            {sideTab === 'runs' && (
                <RunsPane
                    flow={flow}
                    runs={runs}
                    running={running}
                    onRunNow={onRunNow}
                    onViewRunDetails={onViewRunDetails}
                    onKillRun={onKillRun}
                    onClearAll={onClearAll}
                    onDeleteSelected={onDeleteSelected}
                    clearing={clearing}
                    canEdit={canEdit}
                />
            )}
            {sideTab === 'mailboxes' && (
                <MailboxesPane
                    flowId={flow.id}
                    isNodalFlow={isNodalFlow}
                    watchers={mailboxWatchers || []}
                    groups={watcherGroups || []}
                    mailboxes={mailboxes || []}
                    teams={teams}
                />
            )}
            {sideTab === 'settings' && canEdit && (
                <SettingsPane
                    flow={flow}
                    workspaceProxies={workspaceProxies}
                    scrollTo={settingsScrollToRef.current}
                    onScrollHandled={() => { settingsScrollToRef.current = null; }}
                    onDirtyChange={onSettingsDirtyChange}
                />
            )}
            {showRepository && sideTab === 'repository' && (
                <RepositoryPane
                    flow={flow}
                    integrations={repositoryIntegrations}
                />
            )}
        </S.SidePanel>
    );
}
