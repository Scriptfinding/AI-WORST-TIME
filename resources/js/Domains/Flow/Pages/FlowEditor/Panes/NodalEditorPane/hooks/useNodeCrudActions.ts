import type React from 'react';
import { useCallback } from 'react';
import { formatEntryLabel } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/catalog';
import { normalizeScalarParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/expression';
import { nodeDisplayLabel, uniqueNodeLabel } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/node';
import type {
    CanvasEdge,
    CanvasNode,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { reconnectDeletedLinearNodes } from './nodeActions.utils';

interface UseNodeCrudActionsOptions {
    nodes: CanvasNode[];
    readOnly: boolean;
    recordHistory: () => void;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    setEditingNode: React.Dispatch<React.SetStateAction<CanvasNode | null>>;
    setOpenNodeMenuId: React.Dispatch<React.SetStateAction<string | null>>;
}

// Removes nodes and manages graph-level node creation or replacement operations.
export function useNodeCrudActions({
    nodes,
    readOnly,
    recordHistory,
    setNodes,
    setEdges,
    setSelectedNodeIds,
    setEditingNode,
    setOpenNodeMenuId,
}: UseNodeCrudActionsOptions) {
    const renameNode = useCallback((nodeId: string, label: string) => {
        if (readOnly) return;

        const currentNode = nodes.find(node => node.id === nodeId);
        if (!currentNode) return;

        if (currentNode.system === 'function' && currentNode.scopeId) {
            const currentName = normalizeScalarParameterValue(currentNode.values.name).value.trim();
            const nextName = label.trim() || currentName;
            if (!nextName || currentName === nextName) return;

            recordHistory();
            setNodes(current => current.map(node => node.id === nodeId
                ? {
                    ...node,
                    label: nextName,
                    values: {
                        ...node.values,
                        name: { mode: 'fixed', value: nextName },
                    },
                }
                : node));
            return;
        }

        const baseLabel = label.trim() || formatEntryLabel(currentNode.entry);
        const nextLabel = uniqueNodeLabel(baseLabel, nodes, nodeId);
        if (nodeDisplayLabel(currentNode) === nextLabel) return;

        recordHistory();
        setNodes(current => current.map(node => node.id === nodeId
            ? { ...node, label: nextLabel }
            : node));
    }, [nodes, readOnly, recordHistory, setNodes]);

    const deleteNodes = useCallback((nodeIds: Iterable<string>) => {
        if (readOnly) return;

        const requestedIds = new Set(nodeIds);
        const removableIds = new Set<string>();
        const removedFunctionIds = new Set(nodes
            .filter(node => (
                requestedIds.has(node.id)
                && node.system === 'function'
                && node.scopeId === node.id
            ))
            .map(node => node.id));
        nodes.forEach(node => {
            if (
                (!node.system && requestedIds.has(node.id))
                || (node.scopeId && removedFunctionIds.has(node.scopeId))
                || (node.localFunctionId && removedFunctionIds.has(node.localFunctionId))
            ) {
                removableIds.add(node.id);
            }
        });
        if (removableIds.size === 0) return;

        recordHistory();
        setNodes(current => current.filter(node => !removableIds.has(node.id)));
        setEdges(current => reconnectDeletedLinearNodes(current, removableIds));
        setSelectedNodeIds(current => new Set(
            [...current].filter(nodeId => !removableIds.has(nodeId)),
        ));
        setEditingNode(current => current && removableIds.has(current.id) ? null : current);
        setOpenNodeMenuId(current => current && removableIds.has(current) ? null : current);
    }, [
        nodes,
        readOnly,
        recordHistory,
        setEdges,
        setEditingNode,
        setNodes,
        setOpenNodeMenuId,
        setSelectedNodeIds,
    ]);

    return { deleteNodes, renameNode };
}
