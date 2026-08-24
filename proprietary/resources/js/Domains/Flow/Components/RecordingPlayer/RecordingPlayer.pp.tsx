import { Icon } from '@/Shared/UI/Icon/Icon';
import { useState } from 'react';
import { PlayerContainer, PlayerBody, VideoColumn, VideoWrapper, Video, PlayOverlay, PlayOverlayCircle } from './styled.pp';
import type { ActionLogEntry } from '@/Domains/Flow/types';
import type { FolderTree, TeamTree } from '@/Domains/Folder/types';
import {
    buildAiControlFlow,
    downloadAiControlFlow,
    type AiControlSequence,
    type GeneratedAiControlFlow,
} from '@/Domains/Flow/Utils/aiControlGraph';
import ActionPanel from './ActionPanel.pp';
import GeneratedFlowModal from './GeneratedFlowModal.pp';
import PlayerControls from './PlayerControls.pp';
import { useRecordingPlayback } from './useRecordingPlayback.pp';
import { useRecordingPlayerControls } from './useRecordingPlayerControls.pp';
import { useResizableActionPanel } from './useResizableActionPanel.pp';
import { useActionResourceLabels } from './useActionResourceLabels.pp';

interface Props {
    src: string;
    actionLogs: ActionLogEntry[] | null;
    flowId?: Id;
    legend?: string | null;
    flowName?: string;
    personalTree?: FolderTree[];
    workspaceTree?: FolderTree[];
    teamTrees?: TeamTree[];
}

export default function RecordingPlayer({
    src,
    actionLogs,
    flowId,
    flowName = 'AI generated flow',
    personalTree = [],
    workspaceTree = [],
    teamTrees = [],
}: Props) {
    const actions = actionLogs ?? [];
    const resourceLabels = useActionResourceLabels(flowId);
    const [generatedFlow, setGeneratedFlow] = useState<GeneratedAiControlFlow | null>(null);
    const {
        activeIndex,
        activeRowRef,
        currentTime,
        duration,
        handleTimelineClick,
        playing,
        progressRef,
        remainingTimeLabelRef,
        selectAction,
        showRemainingTime,
        timeLabelRef,
        togglePlay,
        toggleTimeDisplay,
        videoRef,
    } = useRecordingPlayback(actions);
    const {
        containerRef,
        isFullscreen,
        toggleFullscreen,
    } = useRecordingPlayerControls(videoRef, togglePlay);
    const {
        handleResizeStart,
        panelOpen,
        panelRef,
        panelWidth,
        togglePanel,
    } = useResizableActionPanel(containerRef);

    const hasActions = actions.length > 0;
    const buildFlow = (sequence: AiControlSequence) => buildAiControlFlow(sequence, flowName);

    return (
        <>
            <PlayerContainer ref={containerRef} tabIndex={-1}>
                <PlayerBody>
                    <VideoColumn>
                        <VideoWrapper onClick={togglePlay}>
                            <Video ref={videoRef} src={src} preload="metadata" />
                            <PlayOverlay>
                                <PlayOverlayCircle>
                                    <Icon
                                        icon={playing ? 'lucide:pause' : 'lucide:play'}
                                        width={22}
                                        height={22}
                                    />
                                </PlayOverlayCircle>
                            </PlayOverlay>
                        </VideoWrapper>

                        <PlayerControls
                            currentTime={currentTime}
                            duration={duration}
                            hasActions={hasActions}
                            isFullscreen={isFullscreen}
                            onTimelineClick={handleTimelineClick}
                            panelOpen={panelOpen}
                            playing={playing}
                            progressRef={progressRef}
                            remainingTimeLabelRef={remainingTimeLabelRef}
                            showRemainingTime={showRemainingTime}
                            src={src}
                            timeLabelRef={timeLabelRef}
                            toggleFullscreen={toggleFullscreen}
                            togglePanel={togglePanel}
                            togglePlay={togglePlay}
                            toggleTimeDisplay={toggleTimeDisplay}
                            videoRef={videoRef}
                        />
                    </VideoColumn>

                    {hasActions && panelOpen && (
                        <ActionPanel
                            actions={actions}
                            resourceLabels={resourceLabels}
                            activeIndex={activeIndex}
                            activeRowRef={activeRowRef}
                            onClose={togglePanel}
                            onResizeStart={handleResizeStart}
                            panelRef={panelRef}
                            panelWidth={panelWidth}
                            selectAction={selectAction}
                            onCreateFlow={sequence => setGeneratedFlow(buildFlow(sequence))}
                            onDownloadFlow={sequence => downloadAiControlFlow(buildFlow(sequence))}
                        />
                    )}
                </PlayerBody>
            </PlayerContainer>
            <GeneratedFlowModal
                flow={generatedFlow}
                personalTree={personalTree}
                workspaceTree={workspaceTree}
                teamTrees={teamTrees}
                onClose={() => setGeneratedFlow(null)}
            />
        </>
    );
}
