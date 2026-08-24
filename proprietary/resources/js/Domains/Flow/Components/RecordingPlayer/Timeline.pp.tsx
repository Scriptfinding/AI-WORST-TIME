import type { MouseEventHandler, RefObject } from 'react';
import { TimelineWrapper, TimelineTrack, TimelineProgress } from './Timeline.styled.pp';

interface Props {
    currentTime: number;
    duration: number;
    onClick: MouseEventHandler<HTMLDivElement>;
    progressRef: RefObject<HTMLDivElement | null>;
}

export default function Timeline({ currentTime, duration, onClick, progressRef }: Props) {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <TimelineWrapper onClick={onClick}>
            <TimelineTrack />
            <TimelineProgress ref={progressRef} $pct={progress} />
        </TimelineWrapper>
    );
}
