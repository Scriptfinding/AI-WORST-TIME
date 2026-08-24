import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, RefObject } from 'react';
import type { ActionLogEntry } from '@/Domains/Flow/types';
import { findActiveIndex, formatTime } from './helpers.pp';

function updatePlaybackDisplay(
    video: HTMLVideoElement,
    progressRef: RefObject<HTMLDivElement | null>,
    timeLabelRef: RefObject<HTMLSpanElement | null>,
    remainingTimeLabelRef: RefObject<HTMLButtonElement | null>,
    showRemainingTime: boolean,
) {
    const progress = (video.currentTime / video.duration) * 100;

    if (progressRef.current) {
        progressRef.current.style.width = `${progress}%`;
    }
    if (timeLabelRef.current) {
        timeLabelRef.current.textContent = formatTime(video.currentTime);
    }
    if (remainingTimeLabelRef.current) {
        remainingTimeLabelRef.current.textContent = showRemainingTime
            ? `-${formatTime(Math.max(0, video.duration - video.currentTime))}`
            : formatTime(video.duration);
    }
}

// Synchronizes recording playback, timeline progress, and the active action log entry.
export function useRecordingPlayback(actions: ActionLogEntry[]) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const timeLabelRef = useRef<HTMLSpanElement>(null);
    const remainingTimeLabelRef = useRef<HTMLButtonElement>(null);
    const activeRowRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef(0);
    const forcedIndexRef = useRef<number | null>(null);
    const lastScrolledIndexRef = useRef(-1);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [showRemainingTime, setShowRemainingTime] = useState(true);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlay = () => setPlaying(true);
        const handlePause = () => {
            setPlaying(false);
            setCurrentTime(video.currentTime);
        };
        const handleSeeked = () => {
            setCurrentTime(video.currentTime);
            if (video.duration > 0) {
                updatePlaybackDisplay(
                    video,
                    progressRef,
                    timeLabelRef,
                    remainingTimeLabelRef,
                    showRemainingTime,
                );
            }

            const nextIndex = forcedIndexRef.current ?? findActiveIndex(actions, video.currentTime * 1000);
            setActiveIndex(nextIndex);
            lastScrolledIndexRef.current = -1;
        };
        const handleMetadata = () => {
            setDuration(video.duration);
            try {
                const timestamp = new URLSearchParams(window.location.search).get('t');
                if (timestamp !== null) {
                    const seconds = parseFloat(timestamp);
                    if (isFinite(seconds) && seconds > 0 && seconds < video.duration) {
                        video.currentTime = seconds;
                        video.play();
                    }
                }
            } catch {
                // Ignore malformed timestamp query parameters.
            }
        };
        const handleEnded = () => {
            setPlaying(false);
            setCurrentTime(video.duration);
            if (progressRef.current) {
                progressRef.current.style.width = '100%';
            }
            if (timeLabelRef.current) {
                timeLabelRef.current.textContent = formatTime(video.duration);
            }
            if (remainingTimeLabelRef.current && showRemainingTime) {
                remainingTimeLabelRef.current.textContent = `-${formatTime(0)}`;
            }
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('seeked', handleSeeked);
        video.addEventListener('loadedmetadata', handleMetadata);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('seeked', handleSeeked);
            video.removeEventListener('loadedmetadata', handleMetadata);
            video.removeEventListener('ended', handleEnded);
        };
    }, [actions, showRemainingTime]);

    useEffect(() => {
        if (!playing) {
            cancelAnimationFrame(animationFrameRef.current);
            return;
        }

        const updatePlayback = () => {
            const video = videoRef.current;
            if (video && video.duration > 0) {
                updatePlaybackDisplay(
                    video,
                    progressRef,
                    timeLabelRef,
                    remainingTimeLabelRef,
                    showRemainingTime,
                );

                const currentTimeMs = video.currentTime * 1000;
                const automaticIndex = findActiveIndex(actions, currentTimeMs);
                if (forcedIndexRef.current !== null) {
                    const forcedIndex = forcedIndexRef.current;
                    const forcedTimeMs = actions[forcedIndex]?.offset_ms ?? 0;
                    if (currentTimeMs > forcedTimeMs + 500) {
                        forcedIndexRef.current = null;
                        setActiveIndex(automaticIndex);
                    } else {
                        setActiveIndex(forcedIndex);
                    }
                } else {
                    setActiveIndex(automaticIndex);
                }
            }
            animationFrameRef.current = requestAnimationFrame(updatePlayback);
        };

        animationFrameRef.current = requestAnimationFrame(updatePlayback);

        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [actions, playing, showRemainingTime]);

    useEffect(() => {
        if (
            activeIndex >= 0 &&
            activeIndex !== lastScrolledIndexRef.current &&
            activeRowRef.current
        ) {
            activeRowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            lastScrolledIndexRef.current = activeIndex;
        }
    }, [activeIndex]);

    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }, []);

    const toggleTimeDisplay = useCallback(() => {
        setShowRemainingTime((currentValue) => !currentValue);
    }, []);

    const seekTo = useCallback((timeMs: number, fromActionClick = false) => {
        const video = videoRef.current;
        if (!video) return;

        const wasPlaying = !video.paused;
        const ended = video.ended;
        const targetSeconds = timeMs / 1000;
        video.currentTime = targetSeconds;

        const canPlay = video.duration && targetSeconds < video.duration - 0.5;
        if (fromActionClick && canPlay && (wasPlaying || ended)) {
            video.play();
        }
        if (fromActionClick) {
            const url = new URL(window.location.href);
            url.searchParams.set('t', String(Math.round(targetSeconds)));
            window.history.replaceState(null, '', url.toString());
        }
    }, []);

    const handleTimelineClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        if (!video || !duration) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
        video.currentTime = progress * duration;
        if (video.paused) {
            video.play();
        }
    }, [duration]);

    const selectAction = useCallback((index: number, timeMs: number) => {
        forcedIndexRef.current = index;
        setActiveIndex(index);
        lastScrolledIndexRef.current = -1;
        seekTo(timeMs, true);
    }, [seekTo]);

    return {
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
    };
}
