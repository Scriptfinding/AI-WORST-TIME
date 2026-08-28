import type React from 'react';
import { useCallback } from 'react';
import { DEFAULT_INPUT_PORT } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import {
    connectEdgeWithStructuredJoins,
    connectsSeparateSystemFlows,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/edges';
import { getPortPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/geometry';
import type {
    CanvasNode,
    NodePortKind,
    NodePortSide,
    Point,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { UseCanvasInteractionsOptions } from './useCanvasInteractions.types';

type UseCanvasEdgeInteractionsOptions = Pick<
    UseCanvasInteractionsOptions,
    | 'activatePane'
    | 'connectionDragRef'
    | 'edges'
    | 'nodes'
    | 'readOnly'
    | 'recordHistory'
    | 'setConnectionDrag'
    | 'setEdgeDropTarget'
    | 'setEdges'
    | 'setPendingConnectionTarget'
    | 'setPendingEdgeInsertion'
    | 'setPickerOpen'
    | 'setSearch'
>;

// Manages connection dragging, edge insertion, reconnection, and deletion gestures.
export function useCanvasEdgeInteractions({
    activatePane,
    connectionDragRef,
    edges,
    nodes,
    readOnly,
    recordHistory,
    setConnectionDrag,
    setEdgeDropTarget,
    setEdges,
    setPendingConnectionTarget,
    setPendingEdgeInsertion,
    setPickerOpen,
    setSearch,
}: UseCanvasEdgeInteractionsOptions) {
    const handleConnectionPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>, pointerWorld: Point | null) => {
        const connectionDragState = connectionDragRef.current;
        if (!connectionDragState || connectionDragState.pointerId !== event.pointerId) return false;
        if (!pointerWorld) return true;

        const nextDrag = {
            ...connectionDragState,
            currentX: pointerWorld.x,
            currentY: pointerWorld.y,
        };
        connectionDragRef.current = nextDrag;
        setConnectionDrag(nextDrag);
        return true;
    }, [connectionDragRef, setConnectionDrag]);

    const handleConnectionPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const connectionDragState = connectionDragRef.current;
        if (!connectionDragState || connectionDragState.pointerId !== event.pointerId) return false;

        const targetElement = document.elementFromPoint(event.clientX, event.clientY);
        const targetPortElement = targetElement?.closest<HTMLElement>('[data-node-port]');
        const targetNodeElement = targetElement?.closest<HTMLElement>('[data-node-card]');
        const targetNodeId = targetPortElement?.dataset.nodeId ?? targetNodeElement?.dataset.nodeId;
        const targetPort = (targetPortElement?.dataset.portKind as NodePortKind | undefined)
            ?? (targetNodeId && targetNodeId !== connectionDragState.fromNodeId ? DEFAULT_INPUT_PORT : undefined);
        const targetSide = (targetPortElement?.dataset.portSide as NodePortSide | undefined)
            ?? (targetNodeId && targetNodeId !== connectionDragState.fromNodeId ? 'input' : undefined);

        if (
            targetNodeId
            && targetPort
            && targetSide
            && targetNodeId !== connectionDragState.fromNodeId
            && targetSide !== connectionDragState.fromSide
        ) {
            const sourceNodeId = connectionDragState.fromSide === 'output' ? connectionDragState.fromNodeId : targetNodeId;
            const finalTargetNodeId = connectionDragState.fromSide === 'output' ? targetNodeId : connectionDragState.fromNodeId;
            const sourcePort = connectionDragState.fromSide === 'output' ? connectionDragState.fromPort : targetPort;
            const targetPortId = connectionDragState.fromSide === 'output' ? targetPort : connectionDragState.fromPort;
            const sourceNode = nodes.find(node => node.id === sourceNodeId);
            const targetNode = nodes.find(node => node.id === finalTargetNodeId);
            if ((sourceNode?.scopeId ?? null) !== (targetNode?.scopeId ?? null)) {
                connectionDragRef.current = null;
                setConnectionDrag(null);
                return true;
            }
            if (connectsSeparateSystemFlows(nodes, edges, sourceNodeId, finalTargetNodeId)) {
                connectionDragRef.current = null;
                setConnectionDrag(null);
                return true;
            }

            recordHistory();
            setEdges(current => connectEdgeWithStructuredJoins(
                nodes,
                current,
                {
                    id: `${sourceNodeId}:${sourcePort}->${finalTargetNodeId}:${targetPortId}`,
                    sourceNodeId,
                    targetNodeId: finalTargetNodeId,
                    sourcePort,
                    targetPort: targetPortId,
                },
            ));
        } else if (!targetNodeId || targetNodeId === connectionDragState.fromNodeId) {
            setPendingConnectionTarget({
                fromNodeId: connectionDragState.fromNodeId,
                fromPort: connectionDragState.fromPort,
                fromSide: connectionDragState.fromSide,
                x: connectionDragState.currentX,
                y: connectionDragState.currentY,
            });
            setPendingEdgeInsertion(null);
            setSearch('');
            setPickerOpen(false);
            window.requestAnimationFrame(() => setPickerOpen(true));
        }

        connectionDragRef.current = null;
        setConnectionDrag(null);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        return true;
    }, [connectionDragRef, edges, nodes, recordHistory, setConnectionDrag, setEdges, setPendingConnectionTarget, setPendingEdgeInsertion, setPickerOpen, setSearch]);

    const handlePortPointerDown = useCallback((
        event: React.PointerEvent<HTMLDivElement>,
        node: CanvasNode,
        port: NodePortKind,
        side: NodePortSide,
    ) => {
        activatePane();
        if (readOnly || event.button !== 0) return;

        event.stopPropagation();
        const start = getPortPosition(node, port, side);
        const nextDrag = {
            pointerId: event.pointerId,
            fromNodeId: node.id,
            fromPort: port,
            fromSide: side,
            startX: start.x,
            startY: start.y,
            currentX: start.x,
            currentY: start.y,
        };

        connectionDragRef.current = nextDrag;
        setConnectionDrag(nextDrag);
        setEdgeDropTarget(null);
        event.currentTarget.setPointerCapture(event.pointerId);
    }, [activatePane, connectionDragRef, readOnly, setConnectionDrag, setEdgeDropTarget]);

    return {
        handleConnectionPointerMove,
        handleConnectionPointerUp,
        handlePortPointerDown,
    };
}
