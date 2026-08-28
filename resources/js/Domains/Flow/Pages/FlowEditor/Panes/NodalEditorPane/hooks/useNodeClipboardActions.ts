import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import { formatEntryLabel, getEntryByName } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/catalog';
import {
    DEFAULT_INPUT_PORT,
    DEFAULT_OUTPUT_PORT,
    STICKY_NOTE_ENTRY,
    STICKY_NOTE_NODE_NAME,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import {
    normalizeStructuredEdges,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/edges';
import { parseClipboardGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/graph';
import { snapCanvasPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/grid';
import { uniqueNodeLabel } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/node';
import { sanitizeNodeValuesForEntry } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/nodeValues';
import type {
    CanvasEdge,
    CanvasNode,
    NodalGraph,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import {
    DEFAULT_STICKY_NOTE,
    remapNodeValuesReferences,
} from './nodeActions.utils';

interface UseNodeClipboardActionsOptions {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    selectedNodeIds: Set<string>;
    readOnly: boolean;
    recordHistory: () => void;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    toast: (message: string, type?: 'error') => void;
}

// Copies selected nodes and pastes normalized graph fragments into the canvas.
export function useNodeClipboardActions({
    nodes,
    edges,
    selectedNodeIds,
    readOnly,
    recordHistory,
    setNodes,
    setEdges,
    setSelectedNodeIds,
    toast,
}: UseNodeClipboardActionsOptions) {
    const copiedGraphRef = useRef<NodalGraph | null>(null);
    const [canPasteNodes, setCanPasteNodes] = useState(false);

    const copySelectedNodes = useCallback(() => {
        const selectedEditableNodes = nodes.filter(
            node => selectedNodeIds.has(node.id) && !node.system,
        );
        if (selectedEditableNodes.length === 0) return;

        const selectedEditableIds = new Set(selectedEditableNodes.map(node => node.id));
        const selectedGraph: NodalGraph = {
            nodes: selectedEditableNodes.map(node => ({
                id: node.id,
                name: node.kind === 'stickyNote' ? STICKY_NOTE_NODE_NAME : node.entry.name,
                kind: node.kind,
                deactivated: node.deactivated,
                label: node.label,
                x: node.x,
                y: node.y,
                values: sanitizeNodeValuesForEntry(node.entry, node.values),
                callArguments: node.callArguments,
                localFunctionId: node.localFunctionId,
                stickyNote: node.stickyNote ? { ...node.stickyNote } : undefined,
            })),
            edges: edges.filter(
                edge => selectedEditableIds.has(edge.sourceNodeId)
                    && selectedEditableIds.has(edge.targetNodeId),
            ),
        };

        copiedGraphRef.current = selectedGraph;
        setCanPasteNodes(true);
        navigator.clipboard?.writeText(JSON.stringify(selectedGraph, null, 2))
            .then(() => toast(
                `${selectedEditableNodes.length} node${selectedEditableNodes.length > 1 ? 's' : ''} copied`,
            ))
            .catch(() => toast('Unable to copy nodes', 'error'));
    }, [edges, nodes, selectedNodeIds, toast]);

    const pasteGraphAt = useCallback((
        pastedGraph: NodalGraph,
        pastePoint: { x: number; y: number },
    ) => {
        if (readOnly || pastedGraph.nodes.length === 0) return;

        const center = pastedGraph.nodes.reduce(
            (acc, node) => ({ x: acc.x + node.x, y: acc.y + node.y }),
            { x: 0, y: 0 },
        );
        const graphCenter = {
            x: center.x / pastedGraph.nodes.length,
            y: center.y / pastedGraph.nodes.length,
        };
        const suffix = `${Date.now()}`;
        const idMap = new Map(
            pastedGraph.nodes.map(node => [node.id, `${node.id}-paste-${suffix}`]),
        );
        const nextNodes = pastedGraph.nodes.reduce<CanvasNode[]>((acc, node) => {
            const isStickyNote = node.kind === 'stickyNote';
            const entry = isStickyNote ? STICKY_NOTE_ENTRY : getEntryByName(node.name);
            const nextNode: CanvasNode = {
                id: idMap.get(node.id) ?? node.id,
                entry,
                kind: isStickyNote ? 'stickyNote' : undefined,
                deactivated: node.deactivated,
                label: isStickyNote
                    ? node.label
                    : uniqueNodeLabel(
                        node.label?.trim() || formatEntryLabel(entry),
                        [...nodes, ...acc],
                    ),
                x: snapCanvasPosition(pastePoint.x + (node.x - graphCenter.x)),
                y: snapCanvasPosition(pastePoint.y + (node.y - graphCenter.y)),
                values: remapNodeValuesReferences(
                    sanitizeNodeValuesForEntry(entry, node.values),
                    idMap,
                ),
                callArguments: node.callArguments,
                localFunctionId: node.localFunctionId,
                stickyNote: isStickyNote
                    ? { ...(node.stickyNote ?? DEFAULT_STICKY_NOTE) }
                    : undefined,
            };
            return [...acc, nextNode];
        }, []);
        const topologyNodes = [...nodes, ...nextNodes];
        const mappedEdges = pastedGraph.edges.flatMap<CanvasEdge>(edge => {
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
        toast(`${nextNodes.length} node${nextNodes.length > 1 ? 's' : ''} pasted`);
    }, [
        nodes,
        readOnly,
        recordHistory,
        setEdges,
        setNodes,
        setSelectedNodeIds,
        toast,
    ]);

    const pasteNodesFromClipboard = useCallback((pastePoint: { x: number; y: number }) => {
        if (readOnly) return;

        if (!navigator.clipboard) {
            if (copiedGraphRef.current) {
                pasteGraphAt(copiedGraphRef.current, pastePoint);
                return;
            }
            toast('Clipboard is not available', 'error');
            return;
        }

        navigator.clipboard.readText()
            .then(text => {
                const pastedGraph = parseClipboardGraph(text);
                if (pastedGraph) {
                    copiedGraphRef.current = pastedGraph;
                    setCanPasteNodes(true);
                    pasteGraphAt(pastedGraph, pastePoint);
                    return;
                }
                if (copiedGraphRef.current) {
                    pasteGraphAt(copiedGraphRef.current, pastePoint);
                    return;
                }
                toast('No node graph found in clipboard', 'error');
            })
            .catch(() => toast('Unable to read clipboard', 'error'));
    }, [pasteGraphAt, readOnly, toast]);

    return {
        canPasteNodes,
        copySelectedNodes,
        pasteNodesFromClipboard,
    };
}
