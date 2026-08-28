import type React from 'react';
import { useCallback } from 'react';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import {
    DEFAULT_INPUT_PORT,
    DEFAULT_OUTPUT_PORT,
    FUNCTION_DECLARATION_NODE_NAME,
    getNodeOutputPorts,
    SYSTEM_NODE_ENTRIES,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import {
    formatLocalFunctionCallLabel,
    formatEntryLabel,
    getSignatureArgs,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/catalog';
import {
    collectDownstreamNodeIds,
    connectEdgeWithStructuredJoins,
    getEdgeInsertionLayout,
    insertNodeIntoEdge,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/edges';
import { snapCanvasPoint } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/grid';
import { EMPTY_FUNCTION_ARGUMENTS } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/functionArguments';
import { normalizeScalarParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/expression';
import { getInitialNodeValues } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/nodeDefaults';
import { uniqueNodeLabel } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/node';
import type {
    CanvasEdge,
    CanvasNode,
    PendingConnectionTarget,
    PendingEdgeInsertion,
    Point,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { randomCanvasOffset } from './nodeActions.utils';

interface UseAddNodeActionOptions {
    canvasRef: React.RefObject<HTMLDivElement | null>;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    pendingConnectionTarget: PendingConnectionTarget | null;
    pendingEdgeInsertion: PendingEdgeInsertion | null;
    pendingNodePlacementRef: React.MutableRefObject<Point | null>;
    viewport: { x: number; y: number; zoom: number };
    readOnly: boolean;
    recordHistory: () => void;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    setEditingNode: React.Dispatch<React.SetStateAction<CanvasNode | null>>;
    setPendingConnectionTarget: React.Dispatch<React.SetStateAction<PendingConnectionTarget | null>>;
    setPendingEdgeInsertion: React.Dispatch<React.SetStateAction<PendingEdgeInsertion | null>>;
    setPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
}

// Creates catalog nodes at the requested canvas position and records the change.
export function useAddNodeAction({
    canvasRef,
    nodes,
    edges,
    pendingConnectionTarget,
    pendingEdgeInsertion,
    pendingNodePlacementRef,
    viewport,
    readOnly,
    recordHistory,
    setNodes,
    setEdges,
    setSelectedNodeIds,
    setEditingNode,
    setPendingConnectionTarget,
    setPendingEdgeInsertion,
    setPickerOpen,
    setSearch,
}: UseAddNodeActionOptions) {
    return useCallback((entry: HelpEntryDef) => {
        if (readOnly) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        const centerX = rect ? rect.width / 2 : 360;
        const centerY = rect ? rect.height / 2 : 240;
        const randomOffsetX = randomCanvasOffset();
        const randomOffsetY = randomCanvasOffset();
        const newNodeId = `${entry.name}-${Date.now()}-${nodes.length}`;
        const edgeSourceNode = pendingEdgeInsertion
            ? nodes.find(node => node.id === pendingEdgeInsertion.sourceNodeId)
            : null;
        const edgeTargetNode = pendingEdgeInsertion
            ? nodes.find(node => node.id === pendingEdgeInsertion.targetNodeId)
            : null;
        const connectionNode = pendingConnectionTarget
            ? nodes.find(node => node.id === pendingConnectionTarget.fromNodeId)
            : null;
        const edgeInsertionLayout = edgeSourceNode && edgeTargetNode
            ? getEdgeInsertionLayout(edgeSourceNode, edgeTargetNode)
            : null;
        const rawNextX = pendingEdgeInsertion
            ? edgeInsertionLayout?.nodePosition.x ?? pendingEdgeInsertion.x
            : pendingConnectionTarget
                ? pendingConnectionTarget.x
                : pendingNodePlacementRef.current?.x
                    ?? (centerX - viewport.x) / viewport.zoom + randomOffsetX;
        const rawNextY = pendingEdgeInsertion
            ? edgeInsertionLayout?.nodePosition.y ?? pendingEdgeInsertion.y
            : pendingConnectionTarget
                ? pendingConnectionTarget.y
                : pendingNodePlacementRef.current?.y
                    ?? (centerY - viewport.y) / viewport.zoom + randomOffsetY;
        const nextPosition = snapCanvasPoint({ x: rawNextX, y: rawNextY });
        const shiftedNodeIds = pendingEdgeInsertion
            && edgeInsertionLayout
            && (edgeInsertionLayout.targetShift.x || edgeInsertionLayout.targetShift.y)
            ? collectDownstreamNodeIds(
                edges,
                pendingEdgeInsertion.targetNodeId,
                new Set([pendingEdgeInsertion.sourceNodeId]),
            )
            : new Set<string>();
        if (entry.name === FUNCTION_DECLARATION_NODE_NAME) {
            const functionId = `__local_function_${Date.now()}_${nodes.length}`;
            const existingFunctionNames = new Set(nodes
                .filter(node => node.system === 'function' && node.scopeId)
                .map(node => String(normalizeScalarParameterValue(node.values.name).value)));
            let functionIndex = existingFunctionNames.size + 1;
            while (existingFunctionNames.has(`Function${functionIndex}`)) functionIndex++;
            const functionName = `Function${functionIndex}`;
            const functionNode: CanvasNode = {
                id: functionId,
                entry: SYSTEM_NODE_ENTRIES.function,
                label: functionName,
                x: nextPosition.x,
                y: nextPosition.y,
                values: {
                    name: { mode: 'fixed', value: functionName },
                    arguments: EMPTY_FUNCTION_ARGUMENTS,
                },
                system: 'function',
                scopeId: functionId,
                callArguments: [],
            };

            recordHistory();
            setNodes(current => [...current, functionNode]);
            setPickerOpen(false);
            setPendingConnectionTarget(null);
            setPendingEdgeInsertion(null);
            pendingNodePlacementRef.current = null;
            setSearch('');
            setSelectedNodeIds(new Set([functionId]));
            setEditingNode(functionNode);
            return;
        }
        const newNode: CanvasNode = {
            id: newNodeId,
            entry,
            label: uniqueNodeLabel(
                entry.localFunctionId
                    ? formatLocalFunctionCallLabel(entry.name)
                    : formatEntryLabel(entry),
                nodes,
            ),
            x: nextPosition.x,
            y: nextPosition.y,
            values: getInitialNodeValues(entry),
            callArguments: entry.category === 'Snippets' || entry.localFunctionId
                ? getSignatureArgs(entry.signature)
                : undefined,
            localFunctionId: entry.localFunctionId,
            scopeId: edgeSourceNode?.scopeId ?? edgeTargetNode?.scopeId ?? connectionNode?.scopeId,
        };
        const newNodeOutputPort = getNodeOutputPorts(entry.name, entry)[0]?.id ?? DEFAULT_OUTPUT_PORT;
        let preparedEdges: CanvasEdge[] | null = null;

        if (pendingEdgeInsertion) {
            preparedEdges = insertNodeIntoEdge(
                [...nodes, newNode],
                edges,
                { ...pendingEdgeInsertion, id: pendingEdgeInsertion.edgeId },
                newNodeId,
                newNodeOutputPort,
            );
        } else if (pendingConnectionTarget) {
            const sourceNodeId = pendingConnectionTarget.fromSide === 'output'
                ? pendingConnectionTarget.fromNodeId
                : newNodeId;
            const targetNodeId = pendingConnectionTarget.fromSide === 'output'
                ? newNodeId
                : pendingConnectionTarget.fromNodeId;
            const sourcePort = pendingConnectionTarget.fromSide === 'output'
                ? pendingConnectionTarget.fromPort
                : newNodeOutputPort;
            const targetPort = pendingConnectionTarget.fromSide === 'output'
                ? DEFAULT_INPUT_PORT
                : pendingConnectionTarget.fromPort;
            preparedEdges = connectEdgeWithStructuredJoins(
                [...nodes, newNode],
                edges,
                {
                    id: `${sourceNodeId}:${sourcePort}->${targetNodeId}:${targetPort}`,
                    sourceNodeId,
                    targetNodeId,
                    sourcePort,
                    targetPort,
                },
            );
        }
        if ((pendingEdgeInsertion || pendingConnectionTarget) && preparedEdges === edges) return;

        recordHistory();
        setNodes(current => {
            const nextCurrent = pendingEdgeInsertion
                ? current.map(node => {
                    if (!edgeInsertionLayout || shiftedNodeIds.size === 0) return node;
                    return shiftedNodeIds.has(node.id)
                        ? snapCanvasPoint({
                            ...node,
                            x: node.x + edgeInsertionLayout.targetShift.x,
                            y: node.y + edgeInsertionLayout.targetShift.y,
                        })
                        : node;
                })
                : current;

            return [
                ...nextCurrent,
                {
                    ...newNode,
                    label: uniqueNodeLabel(formatEntryLabel(entry), nextCurrent),
                },
            ];
        });
        if (preparedEdges) setEdges(preparedEdges);

        setPickerOpen(false);
        setPendingConnectionTarget(null);
        setPendingEdgeInsertion(null);
        pendingNodePlacementRef.current = null;
        setSearch('');
        setSelectedNodeIds(new Set([newNode.id]));
        setEditingNode(newNode);
    }, [
        canvasRef,
        edges,
        nodes,
        pendingConnectionTarget,
        pendingEdgeInsertion,
        pendingNodePlacementRef,
        viewport,
        readOnly,
        recordHistory,
        setEdges,
        setEditingNode,
        setNodes,
        setPendingConnectionTarget,
        setPendingEdgeInsertion,
        setPickerOpen,
        setSearch,
        setSelectedNodeIds,
    ]);
}
