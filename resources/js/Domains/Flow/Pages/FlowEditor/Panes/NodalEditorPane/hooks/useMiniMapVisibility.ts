import { useCallback, useEffect, useRef, useState } from 'react';

const MINI_MAP_VISIBLE_MS = 3000;
const MINI_MAP_FADE_MS = 220;

// Persists the user's minimap visibility preference for the nodal canvas.
export function useMiniMapVisibility() {
    const hideTimerRef = useRef<number | null>(null);
    const unmountTimerRef = useRef<number | null>(null);
    const [showMiniMap, setShowMiniMap] = useState(false);
    const [miniMapFading, setMiniMapFading] = useState(false);

    const revealMiniMap = useCallback(() => {
        setShowMiniMap(true);
        setMiniMapFading(false);
        if (hideTimerRef.current) {
            window.clearTimeout(hideTimerRef.current);
        }
        if (unmountTimerRef.current) {
            window.clearTimeout(unmountTimerRef.current);
        }
        hideTimerRef.current = window.setTimeout(() => {
            setMiniMapFading(true);
            hideTimerRef.current = null;
            unmountTimerRef.current = window.setTimeout(() => {
                setShowMiniMap(false);
                setMiniMapFading(false);
                unmountTimerRef.current = null;
            }, MINI_MAP_FADE_MS);
        }, MINI_MAP_VISIBLE_MS);
    }, []);

    useEffect(() => () => {
        if (hideTimerRef.current) {
            window.clearTimeout(hideTimerRef.current);
        }
        if (unmountTimerRef.current) {
            window.clearTimeout(unmountTimerRef.current);
        }
    }, []);

    return {
        miniMapFading,
        revealMiniMap,
        showMiniMap,
    };
}
