import type { RefObject } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { ActionLogEntry } from '@/Domains/Flow/types';
import type { FolderTree, TeamTree } from '@/Domains/Folder/types';
import RecordingPlayer from '@proprietary/Domains/Flow/Components/RecordingPlayer/RecordingPlayer.pp';
import type { ConnectionStatus } from '@/Domains/Flow/Components/BrowserPane/hooks/useBrowserStream';
import * as S from './styled';

const STATUS_ICON: Record<ConnectionStatus, string> = {
    idle: 'lucide:monitor',
    connecting: 'lucide:loader-2',
    streaming: 'lucide:monitor-check',
    disconnected: 'lucide:monitor-x',
    ended: 'lucide:monitor-x',
    error: 'lucide:alert-triangle',
};

interface BrowserViewportStateProps {
    actionLogs?: ActionLogEntry[] | null;
    flowId: Id;
    canvasRef: RefObject<HTMLCanvasElement | null>;
    connect: () => void;
    error: string | null;
    isRunning: boolean;
    legend?: string | null;
    liveViewEnabled: boolean;
    recordingUrl?: string | null;
    showCanvas: boolean;
    showOverlay: boolean;
    showRecording: boolean;
    status: ConnectionStatus;
    flowName?: string;
    personalTree?: FolderTree[];
    workspaceTree?: FolderTree[];
    teamTrees?: TeamTree[];
}

export default function BrowserViewportState({
    actionLogs,
    flowId,
    canvasRef,
    connect,
    error,
    isRunning,
    legend,
    liveViewEnabled,
    recordingUrl,
    showCanvas,
    showOverlay,
    showRecording,
    status,
    flowName,
    personalTree,
    workspaceTree,
    teamTrees,
}: BrowserViewportStateProps) {
    const statusLabel: Record<ConnectionStatus, string> = {
        idle: 'Waiting...',
        connecting: 'Connecting to browser...',
        streaming: 'Connected',
        disconnected: 'Disconnected',
        ended: 'Session ended',
        error: error || 'Connection error',
    };

    return (
        <S.Viewport>
            {showRecording && (
                <RecordingPlayer
                    src={recordingUrl!}
                    actionLogs={actionLogs ?? null}
                    flowId={flowId}
                    legend={legend}
                    flowName={flowName}
                    personalTree={personalTree}
                    workspaceTree={workspaceTree}
                    teamTrees={teamTrees}
                />
            )}
            {showOverlay && !showRecording && (
                <S.Overlay>
                    <S.OverlayIcon $status={status}>
                        <Icon
                            icon={STATUS_ICON[status]}
                            width={32}
                            height={32}
                            className={status === 'connecting' ? 'spin' : undefined}
                        />
                    </S.OverlayIcon>
                    <S.OverlayText>{statusLabel[status]}</S.OverlayText>
                    {status === 'error' && isRunning && liveViewEnabled && (
                        <S.RetryButton onClick={connect}>
                            Retry
                        </S.RetryButton>
                    )}
                    {!liveViewEnabled && isRunning && !recordingUrl ? (
                        <S.OverlayHint>
                            Live view is disabled on this instance.
                        </S.OverlayHint>
                    ) : status === 'ended' && !recordingUrl && (
                        <S.OverlayHint>
                            A session recording will appear here once available.
                        </S.OverlayHint>
                    )}
                    {!isRunning && status !== 'ended' && (status as string) !== 'streaming' && liveViewEnabled && (
                        <S.OverlayHint>
                            Live stream is available while a flow is running.
                        </S.OverlayHint>
                    )}
                </S.Overlay>
            )}
            <S.Canvas
                ref={canvasRef}
                tabIndex={0}
                $visible={showCanvas}
            />
        </S.Viewport>
    );
}
