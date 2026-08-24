import { useCallback, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import type { CanvasNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import {
    MINI_MAP_HEIGHT,
    MINI_MAP_PADDING,
    MINI_MAP_WIDTH,
    WORLD_PADDING,
    mergeBounds,
    nodeBounds,
} from './utils';
import type { Bounds, MiniMapProjection } from './utils';

interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

interface UseCanvasMiniMapProps {
    nodes: CanvasNode[];
    canvasRef: React.RefObject<HTMLDivElement | null>;
    viewport: Viewport;
    setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
}

// Calculates minimap bounds and converts minimap gestures into viewport movement.
export default function useCanvasMiniMap({
    nodes,
    canvasRef,
    viewport,
    setViewport,
}: UseCanvasMiniMapProps) {
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateCanvasSize = () => {
            const rect = canvas.getBoundingClientRect();
            setCanvasSize({ width: rect.width, height: rect.height });
        };
        const observer = new ResizeObserver(updateCanvasSize);

        updateCanvasSize();
        observer.observe(canvas);

        return () => observer.disconnect();
    }, [canvasRef]);

    const viewportWorldBounds = useMemo<Bounds | null>(() => {
        if (canvasSize.width <= 0 || canvasSize.height <= 0) return null;

        return {
            minX: -viewport.x / viewport.zoom,
            minY: -viewport.y / viewport.zoom,
            maxX: (canvasSize.width - viewport.x) / viewport.zoom,
            maxY: (canvasSize.height - viewport.y) / viewport.zoom,
        };
    }, [canvasSize.height, canvasSize.width, viewport]);

    const worldBounds = useMemo<Bounds | null>(() => {
        const bounds = [
            ...nodes.map(nodeBounds),
            ...(viewportWorldBounds ? [viewportWorldBounds] : []),
        ];
        if (bounds.length === 0) return null;

        const merged = mergeBounds(bounds);
        return {
            minX: merged.minX - WORLD_PADDING,
            minY: merged.minY - WORLD_PADDING,
            maxX: merged.maxX + WORLD_PADDING,
            maxY: merged.maxY + WORLD_PADDING,
        };
    }, [nodes, viewportWorldBounds]);

    const projection = useMemo<MiniMapProjection | null>(() => {
        if (!worldBounds) return null;

        const worldWidth = Math.max(1, worldBounds.maxX - worldBounds.minX);
        const worldHeight = Math.max(1, worldBounds.maxY - worldBounds.minY);
        const contentWidth = MINI_MAP_WIDTH - MINI_MAP_PADDING * 2;
        const contentHeight = MINI_MAP_HEIGHT - MINI_MAP_PADDING * 2;
        const scale = Math.min(contentWidth / worldWidth, contentHeight / worldHeight);
        const offsetX = (MINI_MAP_WIDTH - worldWidth * scale) / 2;
        const offsetY = (MINI_MAP_HEIGHT - worldHeight * scale) / 2;

        return {
            scale,
            toMiniX: x => offsetX + (x - worldBounds.minX) * scale,
            toMiniY: y => offsetY + (y - worldBounds.minY) * scale,
            toWorldX: x => worldBounds.minX + (x - offsetX) / scale,
            toWorldY: y => worldBounds.minY + (y - offsetY) / scale,
        };
    }, [worldBounds]);

    const moveViewportTo = useCallback((miniX: number, miniY: number) => {
        if (!projection || canvasSize.width <= 0 || canvasSize.height <= 0) return;

        const worldX = projection.toWorldX(miniX);
        const worldY = projection.toWorldY(miniY);
        setViewport(current => ({
            ...current,
            x: canvasSize.width / 2 - worldX * current.zoom,
            y: canvasSize.height / 2 - worldY * current.zoom,
        }));
    }, [canvasSize.height, canvasSize.width, projection, setViewport]);

    return { projection, viewportWorldBounds, moveViewportTo };
}
