import type React from 'react';
import { useCallback } from 'react';
import type { CanvasNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import {
    canDeactivateNode,
    shouldDeactivateNodes,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/node';

interface UseNodeDeactivationActionsOptions {
    nodes: CanvasNode[];
    selectedNodeIds: Set<string>;
    readOnly: boolean;
    recordHistory: () => void;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setOpenNodeMenuId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useNodeDeactivationActions({
    nodes,
    selectedNodeIds,
    readOnly,
    recordHistory,
    setNodes,
    setOpenNodeMenuId,
}: UseNodeDeactivationActionsOptions) {
    const toggleNodeDeactivation = useCallback((nodeIds: Iterable<string>) => {
        if (readOnly) return;

        const requestedIds = new Set(nodeIds);
        const eligibleNodes = nodes.filter(node => requestedIds.has(node.id) && canDeactivateNode(node));
        if (eligibleNodes.length === 0) return;

        const deactivated = shouldDeactivateNodes(eligibleNodes);
        recordHistory();
        setNodes(current => current.map(node => (
            requestedIds.has(node.id) && canDeactivateNode(node)
                ? { ...node, deactivated }
                : node
        )));
        setOpenNodeMenuId(null);
    }, [nodes, readOnly, recordHistory, setNodes, setOpenNodeMenuId]);

    const toggleNodeOrSelectionDeactivation = useCallback((node: CanvasNode) => {
        toggleNodeDeactivation(selectedNodeIds.has(node.id) ? selectedNodeIds : [node.id]);
    }, [selectedNodeIds, toggleNodeDeactivation]);

    return {
        toggleNodeDeactivation,
        toggleNodeOrSelectionDeactivation,
    };
}
