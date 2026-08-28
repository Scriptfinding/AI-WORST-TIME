import type React from 'react';
import { useCallback, useRef } from 'react';
import {
    DEFAULT_OUTPUT_PORT,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import {
    collectDownstreamNodeIds,
    insertNodeIntoEdge,
    type EdgeDropTarget,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/edges';
import { snapCanvasPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/grid';
import {
    isEdgeInsertableNode,
    primaryNodeOutputPort,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/node';
import {
    getDirectionalPushNodeIds,
    getNodeStartPosition,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/movement';
import type {
    CanvasNode,
    Point,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import {
    EDGE_DROP_INFLUENCE_RADIUS,
    findEdgeDropTarget as findCanvasEdgeDropTarget,
    getDragAutoPanDelta,
    hasMovedBeyondDragThreshold,
} from './canvasNodeDrag.utils';
import type { UseCanvasInteractionsOptions } from './useCanvasInteractions.types';

type UseCanvasNodeDragOptions = Pick<
    UseCanvasInteractionsOptions,
    | 'activatePane'
    | 'canvasRef'
    | 'edges'
    | 'nodeDragRef'
    | 'nodes'
    | 'onViewportPan'
    | 'readOnly'
    | 'recordHistory'
    | 'selectedNodeIds'
    | 'setEdgeDropTarget'
    | 'setEdges'
    | 'setNodes'
    | 'setSelectedNodeIds'
    | 'setViewport'
    | 'viewport'
>;

// Drives node dragging, snapping, auto-panning, and drag history recording.
export function useCanvasNodeDragInteractions({
    activatePane,
    canvasRef,
    edges,
    nodeDragRef,
    nodes,
    onViewportPan,
    readOnly,
    recordHistory,
    selectedNodeIds,
    setEdgeDropTarget,
    setEdges,
    setNodes,
    setSelectedNodeIds,
    setViewport,
    viewport,
}: UseCanvasNodeDragOptions) {
    const hasRecordedDragRef = useRef(false);
    const constrainedDragAxisRef = useRef<'horizontal' | 'vertical' | null>(null);

    const findEdgeDropTarget = useCallback((draggedNodeId: string, point: Point, influenceRadius: number): EdgeDropTarget | null => {
        return findCanvasEdgeDropTarget(edges, nodes, draggedNodeId, point, influenceRadius);
    }, [edges, nodes]);

    const handleNodePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const nodeDrag = nodeDragRef.current;
        if (!nodeDrag || nodeDrag.pointerId !== event.pointerId) return false;
        if (!hasMovedBeyondDragThreshold(nodeDrag, event.clientX, event.clientY)) return true;

        if (!hasRecordedDragRef.current) {
            hasRecordedDragRef.current = true;
            recordHistory();
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            const panDelta = getDragAutoPanDelta(rect, event.clientX, event.clientY);
            if (panDelta.x || panDelta.y) {
                nodeDrag.viewportOffsetX += panDelta.x;
                nodeDrag.viewportOffsetY += panDelta.y;
                setViewport(current => ({
                    ...current,
                    x: current.x + panDelta.x,
                    y: current.y + panDelta.y,
                }));
                onViewportPan?.();
            }
        }

        let dx = (event.clientX - nodeDrag.startX - nodeDrag.viewportOffsetX) / viewport.zoom;
        let dy = (event.clientY - nodeDrag.startY - nodeDrag.viewportOffsetY) / viewport.zoom;
        if (event.shiftKey) {
            constrainedDragAxisRef.current ??= Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
            if (constrainedDragAxisRef.current === 'horizontal') dy = 0;
            else dx = 0;
        } else {
            constrainedDragAxisRef.current = null;
        }
        const movedNodeIds = new Set(nodeDrag.nodePositions.map(position => position.id));
        const pushedNodeIds = event.altKey
            ? getDirectionalPushNodeIds(nodeDrag.allNodePositions, nodeDrag.nodePositions, dx, dy)
            : new Set<string>();
        const positionById = new Map(nodeDrag.allNodePositions.map(item => [item.id, item]));

        setNodes(current => current.map(node => {
            const position = positionById.get(node.id);
            if (!position) return node;
            if (!movedNodeIds.has(node.id) && !pushedNodeIds.has(node.id)) {
                return { ...node, x: position.x, y: position.y };
            }

            return {
                ...node,
                x: position.movementAxis === 'vertical' ? position.x : snapCanvasPosition(position.x + dx),
                y: snapCanvasPosition(position.y + dy),
            };
        }));

        const draggedNode = nodes.find(node => node.id === nodeDrag.nodeId);
        const draggedPosition = positionById.get(nodeDrag.nodeId);
        if (draggedNode && isEdgeInsertableNode(draggedNode) && nodeDrag.nodePositions.length === 1 && draggedPosition) {
            setEdgeDropTarget(findEdgeDropTarget(
                nodeDrag.nodeId,
                {
                    x: snapCanvasPosition(draggedPosition.x + dx),
                    y: snapCanvasPosition(draggedPosition.y + dy),
                },
                EDGE_DROP_INFLUENCE_RADIUS / viewport.zoom,
            ));
        } else {
            setEdgeDropTarget(null);
        }
        return true;
    }, [canvasRef, findEdgeDropTarget, nodeDragRef, nodes, onViewportPan, recordHistory, setEdgeDropTarget, setNodes, setViewport, viewport.zoom]);

    const handleNodePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const nodeDrag = nodeDragRef.current;
        if (!nodeDrag || nodeDrag.pointerId !== event.pointerId) return false;

        let dx = (event.clientX - nodeDrag.startX - nodeDrag.viewportOffsetX) / viewport.zoom;
        let dy = (event.clientY - nodeDrag.startY - nodeDrag.viewportOffsetY) / viewport.zoom;
        if (event.shiftKey) {
            constrainedDragAxisRef.current ??= Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
            if (constrainedDragAxisRef.current === 'horizontal') dy = 0;
            else dx = 0;
        }
        const didDrag = hasMovedBeyondDragThreshold(nodeDrag, event.clientX, event.clientY);
        const draggedStartPosition = nodeDrag.nodePositions.find(position => position.id === nodeDrag.nodeId);
        const draggedNode = nodes.find(node => node.id === nodeDrag.nodeId);
        const dropTarget = didDrag && draggedStartPosition && draggedNode && isEdgeInsertableNode(draggedNode)
            ? findEdgeDropTarget(
                nodeDrag.nodeId,
                { x: draggedStartPosition.x + dx, y: draggedStartPosition.y + dy },
                EDGE_DROP_INFLUENCE_RADIUS / viewport.zoom,
            )
            : null;

        if (dropTarget) {
            const targetEdge = edges.find(edge => edge.id === dropTarget.edgeId);
            if (!targetEdge) {
                nodeDragRef.current = null;
                constrainedDragAxisRef.current = null;
                setEdgeDropTarget(null);
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                }
                return true;
            }
            const insertedOutputPort = draggedNode
                ? primaryNodeOutputPort(draggedNode) ?? DEFAULT_OUTPUT_PORT
                : DEFAULT_OUTPUT_PORT;
            const preparedEdges = insertNodeIntoEdge(
                nodes,
                edges,
                targetEdge,
                nodeDrag.nodeId,
                insertedOutputPort,
            );
            if (preparedEdges === edges) {
                nodeDragRef.current = null;
                constrainedDragAxisRef.current = null;
                setEdgeDropTarget(null);
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                }
                return true;
            }

            const shiftedNodeIds = dropTarget.targetShift && (dropTarget.targetShift.x || dropTarget.targetShift.y)
                ? collectDownstreamNodeIds(
                    edges,
                    dropTarget.targetNodeId,
                    new Set([targetEdge.sourceNodeId, nodeDrag.nodeId]),
                )
                : new Set<string>();

            setNodes(current => current.map(node => {
                if (node.id === nodeDrag.nodeId) return { ...node, x: dropTarget.x, y: dropTarget.y };
                if (!shiftedNodeIds.has(node.id) || !dropTarget.targetShift) return node;
                return {
                    ...node,
                    x: snapCanvasPosition(node.x + dropTarget.targetShift.x),
                    y: snapCanvasPosition(node.y + dropTarget.targetShift.y),
                };
            }));
            setEdges(preparedEdges);
        }

        nodeDragRef.current = null;
        constrainedDragAxisRef.current = null;
        setEdgeDropTarget(null);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        return true;
    }, [edges, findEdgeDropTarget, nodeDragRef, nodes, setEdgeDropTarget, setEdges, setNodes, viewport.zoom]);

    const handleNodePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>, node: CanvasNode) => {
        activatePane();
        if (event.button !== 0) return;

        event.stopPropagation();
        if (event.metaKey || event.ctrlKey) {
            const nextSelectedIds = new Set(selectedNodeIds);
            if (nextSelectedIds.has(node.id)) {
                nextSelectedIds.delete(node.id);
            } else {
                nextSelectedIds.add(node.id);
            }
            setSelectedNodeIds(nextSelectedIds);
            return;
        }

        const nextSelectedIds = selectedNodeIds.has(node.id) ? new Set(selectedNodeIds) : new Set([node.id]);
        setSelectedNodeIds(nextSelectedIds);
        if (readOnly) return;

        hasRecordedDragRef.current = false;
        constrainedDragAxisRef.current = null;
        setEdgeDropTarget(null);
        const allNodePositions = nodes.map(getNodeStartPosition);
        const nodePositions = allNodePositions.filter(position => nextSelectedIds.has(position.id));
        if (nodePositions.length === 0) return;

        nodeDragRef.current = {
            pointerId: event.pointerId,
            nodeId: node.id,
            startX: event.clientX,
            startY: event.clientY,
            nodeX: node.x,
            nodeY: node.y,
            viewportOffsetX: 0,
            viewportOffsetY: 0,
            nodePositions,
            allNodePositions,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    }, [activatePane, nodeDragRef, nodes, readOnly, selectedNodeIds, setEdgeDropTarget, setSelectedNodeIds]);

    return {
        handleNodePointerDown,
        handleNodePointerMove,
        handleNodePointerUp,
    };
}
