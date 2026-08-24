import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

// Adds fullscreen state and keyboard playback controls to the recording player.
export function useRecordingPlayerControls(
    videoRef: RefObject<HTMLVideoElement | null>,
    togglePlay: () => void,
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen();
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        containerRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.target as HTMLElement)?.closest('input, textarea, select, [contenteditable]')) {
                return;
            }

            const video = videoRef.current;
            if (event.code === 'Space') {
                event.preventDefault();
                togglePlay();
            } else if (event.code === 'ArrowLeft' && video) {
                event.preventDefault();
                video.currentTime = Math.max(0, video.currentTime - 3);
                if (video.paused) video.play();
            } else if (event.code === 'ArrowRight' && video) {
                event.preventDefault();
                video.currentTime = Math.min(video.duration || 0, video.currentTime + 3);
                if (video.paused) video.play();
            } else if (event.code === 'KeyF') {
                event.preventDefault();
                toggleFullscreen();
            }
        };
        const container = containerRef.current;
        if (container) {
            container.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            if (container) {
                container.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, [toggleFullscreen, togglePlay, videoRef]);

    return {
        containerRef,
        isFullscreen,
        toggleFullscreen,
    };
}
