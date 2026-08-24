import type React from 'react';
import { useCallback } from 'react';
import type { UseCanvasInteractionsOptions } from './useCanvasInteractions.types';

type UseCanvasContextMenuOptions = Pick<
    UseCanvasInteractionsOptions,
    | 'activatePane'
    | 'canvasMode'
    | 'getWorldPointFromClient'
    | 'nodes'
    | 'selectedNodeIds'
    | 'setContextMenu'
    | 'setPendingConnectionTarget'
    | 'setPendingEdgeInsertion'
    | 'setPickerOpen'
    | 'setSelectedNodeIds'
>;

// Opens the correct canvas context menu at the pointer's world position.
export function useCanvasContextMenu({
    activatePane,
    canvasMode,
    getWorldPointFromClient,
    nodes,
    selectedNodeIds,
    setContextMenu,
    setPendingConnectionTarget,
    setPendingEdgeInsertion,
    setPickerOpen,
    setSelectedNodeIds,
}: UseCanvasContextMenuOptions) {
    return useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        activatePane();
        if (canvasMode !== 'canvas') return;

        event.preventDefault();
        event.stopPropagation();
        const worldPoint = getWorldPointFromClient(event.clientX, event.clientY);
        if (!worldPoint) return;

        const target = event.target instanceof Element ? event.target : null;
        const nodeElement = target?.closest<HTMLElement>('[data-node-card]');
        const nodeId = nodeElement?.dataset.nodeId ?? null;
        const node = nodeId ? nodes.find(item => item.id === nodeId) : null;

        if (node && !selectedNodeIds.has(node.id)) {
            setSelectedNodeIds(new Set([node.id]));
        }

        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            worldX: worldPoint.x,
            worldY: worldPoint.y,
            nodeId: node?.id ?? null,
        });
        setPickerOpen(false);
        setPendingConnectionTarget(null);
        setPendingEdgeInsertion(null);
    }, [activatePane, canvasMode, getWorldPointFromClient, nodes, selectedNodeIds, setContextMenu, setPendingConnectionTarget, setPendingEdgeInsertion, setPickerOpen, setSelectedNodeIds]);
}
