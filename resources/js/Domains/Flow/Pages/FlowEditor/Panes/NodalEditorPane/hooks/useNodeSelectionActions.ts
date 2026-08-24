import type React from 'react';
import { useCallback } from 'react';
import {
    DEFAULT_INPUT_PORT,
    DEFAULT_OUTPUT_PORT,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import { isSingleHandleNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/node';
import type {
    CanvasEdge,
    CanvasNode,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';

interface UseNodeSelectionActionsOptions {
    nodes: CanvasNode[];
    selectedNodeIds: Set<string>;
    readOnly: boolean;
    recordHistory: () => void;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
    setOpenNodeMenuId: React.Dispatch<React.SetStateAction<string | null>>;
}

// Centralizes node selection, range selection, and selection clearing behavior.
export function useNodeSelectionActions({
    nodes,
    selectedNodeIds,
    readOnly,
    recordHistory,
    setNodes,
    setEdges,
    setOpenNodeMenuId,
}: UseNodeSelectionActionsOptions) {
    const swapSelectedNodes = useCallback(() => {
        if (readOnly) return;

        const selectedNodes = nodes.filter(node => selectedNodeIds.has(node.id) && !node.system);
        if (selectedNodes.length !== 2 || !selectedNodes.every(isSingleHandleNode)) return;

        const [firstNode, secondNode] = selectedNodes;
        recordHistory();
        setNodes(current => current.map(node => {
            if (node.id === firstNode.id) return { ...node, x: secondNode.x, y: secondNode.y };
            if (node.id === secondNode.id) return { ...node, x: firstNode.x, y: firstNode.y };
            return node;
        }));
        setEdges(current => current.map(edge => {
            const sourceNodeId = edge.sourceNodeId === firstNode.id
                ? secondNode.id
                : edge.sourceNodeId === secondNode.id
                    ? firstNode.id
                    : edge.sourceNodeId;
            const targetNodeId = edge.targetNodeId === firstNode.id
                ? secondNode.id
                : edge.targetNodeId === secondNode.id
                    ? firstNode.id
                    : edge.targetNodeId;
            const sourcePort = edge.sourcePort ?? DEFAULT_OUTPUT_PORT;
            const targetPort = edge.targetPort ?? DEFAULT_INPUT_PORT;

            return {
                ...edge,
                id: `${sourceNodeId}:${sourcePort}->${targetNodeId}:${targetPort}`,
                sourceNodeId,
                targetNodeId,
                sourcePort,
                targetPort,
            };
        }));
        setOpenNodeMenuId(null);
    }, [
        nodes,
        readOnly,
        recordHistory,
        selectedNodeIds,
        setEdges,
        setNodes,
        setOpenNodeMenuId,
    ]);

    return { swapSelectedNodes };
}
