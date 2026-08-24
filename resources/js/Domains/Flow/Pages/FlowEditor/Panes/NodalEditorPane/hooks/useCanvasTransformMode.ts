import type React from 'react';
import { useCallback, useState } from 'react';
import type { ContextMenuState } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/ContextMenu';
import type {
    CanvasNode,
    PendingConnectionTarget,
    PendingEdgeInsertion,
    Point,
    TransformMode,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { getNodeStartPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/movement';
import { isSingleHandleNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/node';

interface UseCanvasTransformModeOptions {
    canvasMode: 'canvas' | 'code';
    nodes: CanvasNode[];
    readOnly: boolean;
    selectedNodeIds: Set<string>;
    lastPointerWorldRef: React.MutableRefObject<Point | null>;
    recordHistory: () => void;
    setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState | null>>;
    setOpenNodeMenuId: React.Dispatch<React.SetStateAction<string | null>>;
    setPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setPendingConnectionTarget: React.Dispatch<React.SetStateAction<PendingConnectionTarget | null>>;
    setPendingEdgeInsertion: React.Dispatch<React.SetStateAction<PendingEdgeInsertion | null>>;
}

// Switches between canvas pan and selection modes based on pointer modifiers.
export function useCanvasTransformMode({
    canvasMode,
    nodes,
    readOnly,
    selectedNodeIds,
    lastPointerWorldRef,
    recordHistory,
    setContextMenu,
    setOpenNodeMenuId,
    setPickerOpen,
    setPendingConnectionTarget,
    setPendingEdgeInsertion,
}: UseCanvasTransformModeOptions) {
    const [transformMode, setTransformMode] = useState<TransformMode | null>(null);

    const startMoveTransform = useCallback(() => {
        if (readOnly || canvasMode !== 'canvas' || selectedNodeIds.size === 0) return;

        const selectedNodes = nodes.filter(node => selectedNodeIds.has(node.id));
        if (selectedNodes.length === 0) return;

        recordHistory();
        setContextMenu(null);
        setOpenNodeMenuId(null);
        setPickerOpen(false);
        setPendingConnectionTarget(null);
        setPendingEdgeInsertion(null);
        const allNodePositions = nodes.map(getNodeStartPosition);
        setTransformMode({
            kind: 'move',
            origin: lastPointerWorldRef.current ?? {
                x: selectedNodes.reduce((sum, node) => sum + node.x, 0) / selectedNodes.length,
                y: selectedNodes.reduce((sum, node) => sum + node.y, 0) / selectedNodes.length,
            },
            nodePositions: allNodePositions.filter(position => selectedNodeIds.has(position.id)),
            allNodePositions,
        });
    }, [
        canvasMode,
        lastPointerWorldRef,
        nodes,
        readOnly,
        recordHistory,
        selectedNodeIds,
        setContextMenu,
        setOpenNodeMenuId,
        setPendingConnectionTarget,
        setPendingEdgeInsertion,
        setPickerOpen,
    ]);

    const startSwapTransform = useCallback(() => {
        if (readOnly || canvasMode !== 'canvas') return;

        const selectedNodes = nodes.filter(node => selectedNodeIds.has(node.id) && !node.system);
        if (selectedNodes.length !== 2 || !selectedNodes.every(isSingleHandleNode)) return;

        const [firstNode, secondNode] = selectedNodes;
        const dx = secondNode.x - firstNode.x;
        const dy = secondNode.y - firstNode.y;
        const distance = Math.hypot(dx, dy);
        if (distance === 0) return;

        recordHistory();
        setContextMenu(null);
        setOpenNodeMenuId(null);
        setPickerOpen(false);
        setPendingConnectionTarget(null);
        setPendingEdgeInsertion(null);
        setTransformMode({
            kind: 'swap',
            origin: lastPointerWorldRef.current ?? {
                x: (firstNode.x + secondNode.x) / 2,
                y: (firstNode.y + secondNode.y) / 2,
            },
            nodePositions: [
                { id: firstNode.id, x: firstNode.x, y: firstNode.y },
                { id: secondNode.id, x: secondNode.x, y: secondNode.y },
            ],
            axis: { x: dx / distance, y: dy / distance },
            distance,
        });
    }, [
        canvasMode,
        lastPointerWorldRef,
        nodes,
        readOnly,
        recordHistory,
        selectedNodeIds,
        setContextMenu,
        setOpenNodeMenuId,
        setPendingConnectionTarget,
        setPendingEdgeInsertion,
        setPickerOpen,
    ]);

    return {
        setTransformMode,
        startMoveTransform,
        startSwapTransform,
        transformMode,
    };
}
