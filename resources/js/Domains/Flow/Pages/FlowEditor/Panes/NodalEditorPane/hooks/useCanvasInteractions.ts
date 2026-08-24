import type React from 'react';
import { useCallback } from 'react';
import { useCanvasContextMenu } from './useCanvasContextMenu';
import { useCanvasEdgeInteractions } from './useCanvasEdgeInteractions';
import type { UseCanvasInteractionsOptions } from './useCanvasInteractions.types';
import { useCanvasNodeDragInteractions } from './useCanvasNodeDragInteractions';
import { useCanvasPanInteractions } from './useCanvasPanInteractions';
import { useCanvasPointerSelectionInteractions } from './useCanvasPointerSelectionInteractions';

// Composes pointer, pan, edge, context-menu, and node-drag canvas handlers.
export function useCanvasInteractions(options: UseCanvasInteractionsOptions) {
    const {
        activatePane,
        getWorldPointFromClient,
        lastPointerWorldRef,
    } = options;

    const {
        handleAuxClick,
        handlePanPointerDown,
        handlePanPointerMove,
        handlePanPointerUp,
        handleWheel,
    } = useCanvasPanInteractions(options);
    const {
        handleKnifePointerMove,
        handleKnifePointerUp,
        handleSelectionPointerDown,
        handleSelectionPointerMove,
        handleSelectionPointerUp,
    } = useCanvasPointerSelectionInteractions(options);
    const {
        handleNodePointerDown,
        handleNodePointerMove,
        handleNodePointerUp,
    } = useCanvasNodeDragInteractions(options);
    const {
        handleConnectionPointerMove,
        handleConnectionPointerUp,
        handlePortPointerDown,
    } = useCanvasEdgeInteractions(options);
    const handleContextMenu = useCanvasContextMenu(options);

    const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        activatePane();
        if (handlePanPointerDown(event)) return;
        handleSelectionPointerDown(event);
    }, [activatePane, handlePanPointerDown, handleSelectionPointerDown]);

    const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const pointerWorld = getWorldPointFromClient(event.clientX, event.clientY);
        if (pointerWorld) lastPointerWorldRef.current = pointerWorld;

        if (handlePanPointerMove(event)) return;
        if (handleKnifePointerMove(event, pointerWorld)) return;
        if (handleConnectionPointerMove(event, pointerWorld)) return;
        if (handleNodePointerMove(event)) return;
        handleSelectionPointerMove(event);
    }, [getWorldPointFromClient, handleConnectionPointerMove, handleKnifePointerMove, handleNodePointerMove, handlePanPointerMove, handleSelectionPointerMove, lastPointerWorldRef]);

    const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (handlePanPointerUp(event)) return;
        if (handleKnifePointerUp(event)) return;
        if (handleConnectionPointerUp(event)) return;
        if (handleNodePointerUp(event)) return;
        handleSelectionPointerUp(event);
    }, [handleConnectionPointerUp, handleKnifePointerUp, handleNodePointerUp, handlePanPointerUp, handleSelectionPointerUp]);

    return {
        handleAuxClick,
        handleContextMenu,
        handleNodePointerDown,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePortPointerDown,
        handleWheel,
    };
}
