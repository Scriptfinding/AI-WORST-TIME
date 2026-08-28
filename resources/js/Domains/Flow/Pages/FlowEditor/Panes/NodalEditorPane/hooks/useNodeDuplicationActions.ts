import type React from 'react';
import { useCallback } from 'react';
import { formatEntryLabel } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/catalog';
import {
    DEFAULT_INPUT_PORT,
    DEFAULT_OUTPUT_PORT,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import {
    normalizeStructuredEdges,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/edges';
import { snapCanvasPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/grid';
import { uniqueNodeLabel } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/node';
import { sanitizeNodeValuesForEntry } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/nodeValues';
import type {
    CanvasEdge,
    CanvasNode,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { remapNodeValuesReferences } from './nodeActions.utils';

interface UseNodeDuplicationActionsOptions {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    selectedNodeIds: Set<string>;
    readOnly: boolean;
    recordHistory: () => void;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    setOpenNodeMenuId: React.Dispatch<React.SetStateAction<string | null>>;
}

// Duplicates selected nodes with remapped IDs, edges, and offset positions.
export function useNodeDuplicationActions({
    nodes,
    edges,
    selectedNodeIds,
    readOnly,
    recordHistory,
    setNodes,
    setEdges,
    setSelectedNodeIds,
    setOpenNodeMenuId,
}: UseNodeDuplicationActionsOptions) {
    const duplicateNode = useCallback((node: CanvasNode) => {
        if (readOnly || node.system) return;
        recordHistory();

        const nextNode: CanvasNode = {
            ...node,
            id: `${node.entry.name}-${Date.now()}-duplicate`,
            label: node.kind === 'stickyNote'
                ? node.label
                : uniqueNodeLabel(
                    node.label?.trim() || formatEntryLabel(node.entry),
                    nodes,
                ),
            x: snapCanvasPosition(node.x + 48),
            y: snapCanvasPosition(node.y + 48),
            values: sanitizeNodeValuesForEntry(node.entry, node.values),
            stickyNote: node.stickyNote ? { ...node.stickyNote } : undefined,
        };

        setNodes(current => [...current, nextNode]);
        setSelectedNodeIds(new Set([nextNode.id]));
        setOpenNodeMenuId(null);
    }, [nodes, readOnly, recordHistory, setNodes, setOpenNodeMenuId, setSelectedNodeIds]);

    const duplicateSelectedNodes = useCallback(() => {
        if (readOnly) return;

        const selectedEditableNodes = nodes.filter(
            node => selectedNodeIds.has(node.id) && !node.system,
        );
        if (selectedEditableNodes.length === 0) return;

        const suffix = `${Date.now()}-duplicate`;
        const selectedEditableIds = new Set(selectedEditableNodes.map(node => node.id));
        const idMap = new Map(
            selectedEditableNodes.map(node => [node.id, `${node.id}-${suffix}`]),
        );
        const nextNodes = selectedEditableNodes.reduce<CanvasNode[]>((acc, node) => {
            const nextNode: CanvasNode = {
                ...node,
                id: idMap.get(node.id) ?? node.id,
                label: node.kind === 'stickyNote'
                    ? node.label
                    : uniqueNodeLabel(
                        node.label?.trim() || formatEntryLabel(node.entry),
                        [...nodes, ...acc],
                    ),
                x: snapCanvasPosition(node.x + 48),
                y: snapCanvasPosition(node.y + 48),
                values: remapNodeValuesReferences(
                    sanitizeNodeValuesForEntry(node.entry, node.values),
                    idMap,
                ),
                stickyNote: node.stickyNote ? { ...node.stickyNote } : undefined,
            };
            return [...acc, nextNode];
        }, []);
        const topologyNodes = [...nodes, ...nextNodes];
        const mappedEdges = edges.flatMap<CanvasEdge>(edge => {
            if (
                !selectedEditableIds.has(edge.sourceNodeId)
                || !selectedEditableIds.has(edge.targetNodeId)
            ) return [];

            const sourceNodeId = idMap.get(edge.sourceNodeId);
            const targetNodeId = idMap.get(edge.targetNodeId);
            if (!sourceNodeId || !targetNodeId) return [];

            const sourcePort = edge.sourcePort ?? DEFAULT_OUTPUT_PORT;
            const targetPort = edge.targetPort ?? DEFAULT_INPUT_PORT;
            return [{
                id: `${sourceNodeId}:${sourcePort}->${targetNodeId}:${targetPort}`,
                sourceNodeId,
                targetNodeId,
                sourcePort,
                targetPort,
            }];
        });
        const nextEdges = normalizeStructuredEdges(topologyNodes, mappedEdges);

        recordHistory();
        setNodes(current => [...current, ...nextNodes]);
        setEdges(current => [...current, ...nextEdges]);
        setSelectedNodeIds(new Set(nextNodes.map(node => node.id)));
        setOpenNodeMenuId(null);
    }, [
        edges,
        nodes,
        readOnly,
        recordHistory,
        selectedNodeIds,
        setEdges,
        setNodes,
        setOpenNodeMenuId,
        setSelectedNodeIds,
    ]);

    return { duplicateNode, duplicateSelectedNodes };
}
