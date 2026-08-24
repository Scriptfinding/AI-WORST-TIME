import { Icon } from '@/Shared/UI/Icon/Icon';
import type { MouseEventHandler, RefObject } from 'react';
import { Controls, ControlButton, TimeLabel, TimeToggle, DownloadLink } from './PlayerControls.styled.pp';
import { useToast } from '@/App/Hooks/useToast';
import { formatTime } from './helpers.pp';
import Timeline from './Timeline.pp';

interface Props {
    currentTime: number;
    duration: number;
    hasActions: boolean;
    isFullscreen: boolean;
    onTimelineClick: MouseEventHandler<HTMLDivElement>;
    panelOpen: boolean;
    playing: boolean;
    progressRef: RefObject<HTMLDivElement | null>;
    remainingTimeLabelRef: RefObject<HTMLButtonElement | null>;
    showRemainingTime: boolean;
    src: string;
    timeLabelRef: RefObject<HTMLSpanElement | null>;
    toggleFullscreen: () => void;
    togglePanel: () => void;
    togglePlay: () => void;
    toggleTimeDisplay: () => void;
    videoRef: RefObject<HTMLVideoElement | null>;
}

export default function PlayerControls({
    currentTime,
    duration,
    hasActions,
    isFullscreen,
    onTimelineClick,
    panelOpen,
    playing,
    progressRef,
    remainingTimeLabelRef,
    showRemainingTime,
    src,
    timeLabelRef,
    toggleFullscreen,
    togglePanel,
    togglePlay,
    toggleTimeDisplay,
    videoRef,
}: Props) {
    const { toast } = useToast();

    const copyPlayerUrl = () => {
        const playerUrl = new URL(`${src}/player`, window.location.origin);
        const video = videoRef.current;
        if (video && video.currentTime > 0) {
            playerUrl.searchParams.set('t', String(Math.round(video.currentTime)));
        }
        navigator.clipboard.writeText(playerUrl.href);
        toast('Player URL copied to clipboard');
    };

    return (
        <Controls>
            <ControlButton onClick={togglePlay} title={playing ? 'Pause' : 'Play'}>
                <Icon icon={playing ? 'lucide:pause' : 'lucide:play'} width={16} height={16} />
            </ControlButton>

            <TimeLabel ref={timeLabelRef}>{formatTime(currentTime)}</TimeLabel>
            <Timeline
                currentTime={currentTime}
                duration={duration}
                onClick={onTimelineClick}
                progressRef={progressRef}
            />
            <TimeToggle
                ref={remainingTimeLabelRef}
                onClick={toggleTimeDisplay}
                title={showRemainingTime ? 'Show total duration' : 'Show remaining time'}
            >
                {showRemainingTime ? `-${formatTime(Math.max(0, duration - currentTime))}` : formatTime(duration)}
            </TimeToggle>

            <ControlButton onClick={copyPlayerUrl} title="Copy player URL">
                <Icon icon="lucide:link" width={15} height={15} />
            </ControlButton>
            <DownloadLink href={src} download title="Download recording">
                <Icon icon="lucide:download" width={15} height={15} />
            </DownloadLink>
            {hasActions && (
                <ControlButton
                    onClick={togglePanel}
                    title={panelOpen ? 'Hide actions' : 'Show actions'}
                >
                    <Icon
                        icon={panelOpen ? 'lucide:panel-right-close' : 'lucide:panel-right-open'}
                        width={15}
                        height={15}
                    />
                </ControlButton>
            )}
            <ControlButton
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
                <Icon
                    icon={isFullscreen ? 'lucide:minimize' : 'lucide:maximize'}
                    width={15}
                    height={15}
                />
            </ControlButton>
        </Controls>
    );
}
