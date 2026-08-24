import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { ModalTabContent, BrowserEmptyState } from './RunDetailContent.styled';
import type { Flow, FlowRun } from '@/Domains/Flow/types';
import ConsoleLogView from '@/Domains/Flow/Pages/FlowEditor/components/ConsoleLogView/ConsoleLogView';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { EmptyText, RunListEmpty } from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import ArtifactsTab from './ArtifactsTab/ArtifactsTab';
import BrowserTab from './BrowserTab/BrowserTab';
import CodePane from './CodePane/CodePane';
import DataTab from './DataTab/DataTab';
import DetailTabs, { type DetailTab } from './DetailTabs/DetailTabs';
import MobileCodeSnapshot from './MobileCodeSnapshot';
import ResizableRunLayout from './ResizableRunLayout/ResizableRunLayout';
import TriggerTab from './TriggerTab/TriggerTab';
import { useRunArtifacts } from './hooks/useRunArtifacts';
import { useConsoleResize } from './hooks/useRunDetailResize';
import { getVisibleConsoleLogs } from './runProgress';

interface RunDetailContentProps {
    run: FlowRun;
    flowId: Id;
    flow?: Flow;
    visualGraph?: NodalGraph | null;
    resolvedTheme: string;
    liveViewEnabled: boolean;
    recordingEnabled: boolean;
    disabledFeatureMessage: string;
    isWaitingHuman: boolean;
    validationMessage: string | null;
    continuing: boolean;
    onContinue: () => void;
    copyToClipboard: (text: string) => void;
}

export default function RunDetailContent({
    run,
    flowId,
    flow,
    visualGraph,
    resolvedTheme,
    liveViewEnabled,
    recordingEnabled,
    disabledFeatureMessage,
    isWaitingHuman,
    validationMessage,
    continuing,
    onContinue,
    copyToClipboard,
}: RunDetailContentProps) {
    const [detailTab, setDetailTabRaw] = useState<DetailTab>('data');
    const [consoleOpen, setConsoleOpen] = useState(() => {
        try {
            return localStorage.getItem('nop-run-console-open') === 'true';
        } catch {
            return false;
        }
    });
    const [userDataOnly, setUserDataOnly] = useState(false);
    const { consoleHeight, startConsoleResize } = useConsoleResize();
    const artifacts = useRunArtifacts(run, flowId, detailTab === 'artifacts');
    const visibleConsoleLogs = useMemo(
        () => getVisibleConsoleLogs(run.console_logs),
        [run.console_logs],
    );
    const isActive = run.status === 'pending' || run.status === 'running';
    const canShowBrowser = (liveViewEnabled && isActive) || run.has_recording;
    const browserUnavailableMessage = liveViewEnabled || recordingEnabled
        ? 'No live stream or recording available for this run.'
        : disabledFeatureMessage;

    useEffect(() => {
        try {
            const stored = localStorage.getItem('nop-run-detail-tab') as DetailTab | null;
            setDetailTabRaw(stored ?? 'data');
        } catch {
            setDetailTabRaw('data');
        }
    }, [run.id]);

    const setDetailTab = useCallback((tab: DetailTab) => {
        setDetailTabRaw(tab);
        try {
            localStorage.setItem('nop-run-detail-tab', tab);
        } catch {}
    }, []);

    const toggleConsole = useCallback((open: boolean) => {
        setConsoleOpen(open);
        try {
            localStorage.setItem('nop-run-console-open', String(open));
        } catch {}
    }, []);

    return (
        <ResizableRunLayout
            codePane={
                <CodePane
                    run={run}
                    flow={flow}
                    visualGraph={visualGraph}
                    resolvedTheme={resolvedTheme}
                    consoleOpen={consoleOpen}
                    consoleHeight={consoleHeight}
                    copyToClipboard={copyToClipboard}
                    onToggleConsole={toggleConsole}
                    onConsoleResizeStart={startConsoleResize}
                />
            }
        >
            <DetailTabs
                activeTab={detailTab}
                run={run}
                isActive={isActive}
                onChange={setDetailTab}
            />
            <ModalTabContent>
                {detailTab === 'browser' && (
                    canShowBrowser ? (
                        <BrowserTab
                            run={run}
                            flowId={flowId}
                            isWaitingHuman={isWaitingHuman}
                            validationMessage={validationMessage}
                            continuing={continuing}
                            onContinue={onContinue}
                            active
                        />
                    ) : (
                        <BrowserEmptyState>
                            <Icon icon="lucide:monitor-off" width={28} height={28} />
                            <EmptyText>{browserUnavailableMessage}</EmptyText>
                        </BrowserEmptyState>
                    )
                )}
                {detailTab === 'code' && (
                    <MobileCodeSnapshot
                        run={run}
                        flow={flow}
                        visualGraph={visualGraph}
                        resolvedTheme={resolvedTheme}
                        copyToClipboard={copyToClipboard}
                    />
                )}
                {detailTab === 'data' && (
                    <DataTab
                        run={run}
                        userDataOnly={userDataOnly}
                        onToggleUserDataOnly={setUserDataOnly}
                        copyToClipboard={copyToClipboard}
                    />
                )}
                {detailTab === 'console' && (
                    visibleConsoleLogs.length > 0 ? (
                        <ConsoleLogView logs={visibleConsoleLogs} onCopy={copyToClipboard} />
                    ) : (
                        <RunListEmpty><EmptyText>No console logs.</EmptyText></RunListEmpty>
                    )
                )}
                {detailTab === 'trigger' && <TriggerTab run={run} />}
                {detailTab === 'artifacts' && (
                    <ArtifactsTab
                        run={run}
                        flowId={flowId}
                        screenshotFiles={artifacts.screenshotFiles}
                        downloadFiles={artifacts.downloadFiles}
                        screenshotsLoading={artifacts.screenshotsLoading}
                        downloadsLoading={artifacts.downloadsLoading}
                    />
                )}
            </ModalTabContent>
        </ResizableRunLayout>
    );
}
