import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';

const MIN_CANVAS_ZOOM = 0.05;
const MAX_CANVAS_ZOOM = 3;
const NODE_VIEWPORT_HALF_WIDTH = 96;
const NODE_VIEWPORT_HALF_HEIGHT = 86;
const VIEWPORT_FIT_PADDING = 48;

interface CanvasViewportFitOptions {
    maxZoom?: number;
    anchorX?: number;
    anchorY?: number;
}

export function clampCanvasZoom(value: number) {
    return Math.min(MAX_CANVAS_ZOOM, Math.max(MIN_CANVAS_ZOOM, Number(value.toFixed(3))));
}

// Owns canvas pan and zoom state plus coordinate conversion and centering helpers.
export function useCanvasViewport(
    canvasRef: React.RefObject<HTMLDivElement | null>,
    nodes: CanvasNode[],
    fitOptions: CanvasViewportFitOptions = {},
) {
    const hasCenteredInitialViewRef = useRef(false);
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });

    const getWorldPointFromClient = useCallback((clientX: number, clientY: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return null;

        return {
            x: (clientX - rect.left - viewport.x) / viewport.zoom,
            y: (clientY - rect.top - viewport.y) / viewport.zoom,
        };
    }, [canvasRef, viewport]);

    const updateZoom = useCallback((delta: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();

        setViewport(current => {
            const nextZoom = clampCanvasZoom(current.zoom + delta);
            if (!rect) return { ...current, zoom: nextZoom };

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const worldX = (centerX - current.x) / current.zoom;
            const worldY = (centerY - current.y) / current.zoom;

            return {
                x: centerX - worldX * nextZoom,
                y: centerY - worldY * nextZoom,
                zoom: nextZoom,
            };
        });
    }, [canvasRef]);

    const centerViewportOnNodes = useCallback((items: CanvasNode[] = nodes) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0 || rect.height === 0) return false;

        if (items.length === 0) {
            setViewport({ x: 0, y: 0, zoom: 1 });
            return true;
        }

        const minX = Math.min(...items.map(node => node.x - NODE_VIEWPORT_HALF_WIDTH)) - VIEWPORT_FIT_PADDING;
        const maxX = Math.max(...items.map(node => node.x + NODE_VIEWPORT_HALF_WIDTH)) + VIEWPORT_FIT_PADDING;
        const minY = Math.min(...items.map(node => node.y - NODE_VIEWPORT_HALF_HEIGHT)) - VIEWPORT_FIT_PADDING;
        const maxY = Math.max(...items.map(node => node.y + NODE_VIEWPORT_HALF_HEIGHT)) + VIEWPORT_FIT_PADDING;
        const graphWidth = Math.max(1, maxX - minX);
        const graphHeight = Math.max(1, maxY - minY);
        const boundsCenter = {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2,
        };

        setViewport(current => {
            const fitZoom = Math.min(
                rect.width / graphWidth,
                rect.height / graphHeight,
                fitOptions.maxZoom ?? MAX_CANVAS_ZOOM,
            );
            const nextZoom = clampCanvasZoom(fitZoom);
            const anchorX = Math.min(1, Math.max(0, fitOptions.anchorX ?? 0.5));
            const anchorY = Math.min(1, Math.max(0, fitOptions.anchorY ?? 0.5));

            return {
                ...current,
                x: rect.width * anchorX - boundsCenter.x * nextZoom,
                y: rect.height * anchorY - boundsCenter.y * nextZoom,
                zoom: nextZoom,
            };
        });
        return true;
    }, [canvasRef, fitOptions.anchorX, fitOptions.anchorY, fitOptions.maxZoom, nodes]);

    useEffect(() => {
        if (hasCenteredInitialViewRef.current || nodes.length === 0) return;

        let secondFrame = 0;
        const firstFrame = window.requestAnimationFrame(() => {
            secondFrame = window.requestAnimationFrame(() => {
                if (centerViewportOnNodes(nodes)) {
                    hasCenteredInitialViewRef.current = true;
                }
            });
        });

        return () => {
            window.cancelAnimationFrame(firstFrame);
            if (secondFrame) window.cancelAnimationFrame(secondFrame);
        };
    }, [centerViewportOnNodes, nodes]);

    return {
        centerViewportOnNodes,
        getWorldPointFromClient,
        setViewport,
        updateZoom,
        viewport,
    };
}
