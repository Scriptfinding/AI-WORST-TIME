import { usePage } from '@inertiajs/react';
import type { ActionLogEntry } from '@/Domains/Flow/types';
import type { PageProps } from '@/App/types';
import type { FolderTree, TeamTree } from '@/Domains/Folder/types';
import BrowserChrome from './components/BrowserChrome/BrowserChrome';
import BrowserTabStrip from './components/BrowserTabStrip/BrowserTabStrip';
import BrowserViewportState from './components/BrowserViewportState/BrowserViewportState';
import { useBrowserStream } from './hooks/useBrowserStream';
import { useRemoteBrowserInput } from './hooks/useRemoteBrowserInput';
import * as S from './styled';

interface BrowserPaneProps {
    runId: number;
    flowId: Id;
    active: boolean;
    isRunning: boolean;
    recordingUrl?: string | null;
    actionLogs?: ActionLogEntry[] | null;
    legend?: string | null;
    flowName?: string;
    personalTree?: FolderTree[];
    workspaceTree?: FolderTree[];
    teamTrees?: TeamTree[];
}

export default function BrowserPane({
    runId,
    flowId,
    active,
    isRunning,
    recordingUrl,
    actionLogs,
    legend,
    flowName,
    personalTree,
    workspaceTree,
    teamTrees,
}: BrowserPaneProps) {
    const { settings } = usePage().props as unknown as PageProps;
    const liveViewEnabled = settings.live_view_enabled ?? false;
    const stream = useBrowserStream({
        active,
        flowId,
        isRunning,
        liveViewEnabled,
        runId,
    });

    useRemoteBrowserInput({
        canvasRef: stream.canvasRef,
        canInteractRef: stream.canInteractRef,
        metaRef: stream.metaRef,
        send: stream.send,
    });

    const showCanvas = stream.status === 'streaming';
    const showOverlay = !showCanvas && !recordingUrl;
    const showRecording = !showCanvas && !!recordingUrl && !isRunning;

    return (
        <S.BrowserPaneContainer>
            <BrowserChrome
                currentUrl={stream.currentUrl}
                send={stream.send}
                setUrlFocused={stream.setUrlFocused}
                setUrlInput={stream.setUrlInput}
                showCanvas={showCanvas}
                showRecording={showRecording}
                status={stream.status}
                urlInput={stream.urlInput}
            />
            <BrowserTabStrip
                activeTabName={stream.activeTabName}
                canControl={stream.canControl}
                showCanvas={showCanvas}
                tabs={stream.tabs}
                onSelect={tabName => stream.send({ type: 'switchTab', tabName })}
            />
            <BrowserViewportState
                actionLogs={actionLogs}
                flowId={flowId}
                flowName={flowName}
                personalTree={personalTree}
                workspaceTree={workspaceTree}
                teamTrees={teamTrees}
                canvasRef={stream.canvasRef}
                connect={stream.connect}
                error={stream.error}
                isRunning={isRunning}
                legend={legend}
                liveViewEnabled={liveViewEnabled}
                recordingUrl={recordingUrl}
                showCanvas={showCanvas}
                showOverlay={showOverlay}
                showRecording={showRecording}
                status={stream.status}
            />
        </S.BrowserPaneContainer>
    );
}
