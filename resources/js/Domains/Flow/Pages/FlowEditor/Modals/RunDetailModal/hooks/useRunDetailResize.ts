import { useCallback, useRef, useState } from 'react';

const MAX_CONSOLE_HEIGHT_RATIO = 0.8;

// Resizes and persists the run detail console height.
export function useConsoleResize() {
    const [consoleHeight, setConsoleHeight] = useState(() => {
        try {
            const stored = localStorage.getItem('nop-run-console-height');
            if (stored) {
                const height = Number(stored);
                if (Number.isFinite(height) && height >= 60) return height;
            }
        } catch {}
        return 180;
    });
    const resizingRef = useRef(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);

    const startConsoleResize = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        resizingRef.current = true;
        startYRef.current = event.clientY;
        const containerHeight = event.currentTarget.parentElement?.clientHeight ?? window.innerHeight;
        const maxHeight = Math.max(60, Math.floor(containerHeight * MAX_CONSOLE_HEIGHT_RATIO));
        startHeightRef.current = Math.min(consoleHeight, maxHeight);
        setConsoleHeight(startHeightRef.current);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!resizingRef.current) return;
            const delta = startYRef.current - moveEvent.clientY;
            const newHeight = Math.max(60, Math.min(maxHeight, startHeightRef.current + delta));
            setConsoleHeight(newHeight);
        };
        const handleMouseUp = () => {
            resizingRef.current = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            setConsoleHeight(height => {
                try {
                    localStorage.setItem('nop-run-console-height', String(height));
                } catch {}
                return height;
            });
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [consoleHeight]);

    return { consoleHeight, startConsoleResize };
}

// Resizes the code and browser split panes while enforcing usable minimum widths.
export function useSplitResize() {
    const [codePaneWidth, setCodePaneWidth] = useState<number | null>(null);
    const splitRef = useRef<HTMLDivElement>(null);
    const resizingRef = useRef(false);

    const startSplitResize = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        resizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!resizingRef.current || !splitRef.current) return;
            const rect = splitRef.current.getBoundingClientRect();
            const newWidth = moveEvent.clientX - rect.left;
            setCodePaneWidth(Math.max(300, Math.min(newWidth, rect.width - 300)));
        };
        const handleMouseUp = () => {
            resizingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

    return { codePaneWidth, splitRef, startSplitResize };
}
