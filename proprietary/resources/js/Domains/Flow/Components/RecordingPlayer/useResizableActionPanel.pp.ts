import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, RefObject } from 'react';

const PANEL_WIDTH_STORAGE_KEY = 'recording-player-panel-width';
const PANEL_OPEN_STORAGE_KEY = 'recording-player-panel-open';
const DEFAULT_PANEL_WIDTH = 240;
const MIN_PANEL_WIDTH = 160;

function getInitialPanelOpen() {
    try {
        const savedValue = localStorage.getItem(PANEL_OPEN_STORAGE_KEY);
        if (savedValue !== null) {
            return savedValue !== '0';
        }
    } catch {
        // Ignore unavailable browser storage.
    }

    return true;
}

function getInitialPanelWidth() {
    try {
        const savedValue = localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
        if (savedValue) {
            const width = parseInt(savedValue, 10);
            if (width >= MIN_PANEL_WIDTH) {
                return width;
            }
        }
    } catch {
        // Ignore unavailable browser storage.
    }

    return DEFAULT_PANEL_WIDTH;
}

// Manages the recording action panel's persisted visibility and drag-resizable width.
export function useResizableActionPanel(containerRef: RefObject<HTMLDivElement | null>) {
    const panelRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef(false);
    const resizeCleanupRef = useRef<(() => void) | null>(null);
    const [panelOpen, setPanelOpen] = useState(getInitialPanelOpen);
    const [panelWidth, setPanelWidth] = useState(getInitialPanelWidth);

    const togglePanel = useCallback(() => {
        setPanelOpen((isOpen) => {
            const nextValue = !isOpen;
            try {
                localStorage.setItem(PANEL_OPEN_STORAGE_KEY, nextValue ? '1' : '0');
            } catch {
                // Ignore unavailable browser storage.
            }

            return nextValue;
        });
    }, []);

    const handleResizeStart = useCallback((event: MouseEvent) => {
        event.preventDefault();
        draggingRef.current = true;

        const startX = event.clientX;
        const startWidth = panelWidth;
        const handleMove = (moveEvent: globalThis.MouseEvent) => {
            if (!draggingRef.current) return;

            const containerWidth = containerRef.current?.offsetWidth || 800;
            const maxWidth = Math.floor(containerWidth * 0.9);
            const delta = startX - moveEvent.clientX;
            setPanelWidth(Math.max(MIN_PANEL_WIDTH, Math.min(maxWidth, startWidth + delta)));
        };
        const cleanup = () => {
            draggingRef.current = false;
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            resizeCleanupRef.current = null;
        };
        const handleUp = () => {
            cleanup();
            try {
                localStorage.setItem(
                    PANEL_WIDTH_STORAGE_KEY,
                    String(panelRef.current?.offsetWidth ?? panelWidth),
                );
            } catch {
                // Ignore unavailable browser storage.
            }
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        resizeCleanupRef.current = cleanup;
    }, [containerRef, panelWidth]);

    useEffect(() => () => resizeCleanupRef.current?.(), []);

    return {
        handleResizeStart,
        panelOpen,
        panelRef,
        panelWidth,
        togglePanel,
    };
}
