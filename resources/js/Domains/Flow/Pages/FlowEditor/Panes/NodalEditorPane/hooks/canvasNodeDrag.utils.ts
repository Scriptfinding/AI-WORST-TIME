import {
    DEFAULT_INPUT_PORT,
    DEFAULT_OUTPUT_PORT,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import {
    getEdgePolyline,
    getPointToPolylineDistance,
    getPortPosition,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/geometry';
import {
    getEdgeInsertionLayout,
    type EdgeDropTarget,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/edges';
import type {
    CanvasEdge,
    CanvasNode,
    NodeDragState,
    Point,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';

const DRAG_AUTO_PAN_EDGE_SIZE = 72;
const DRAG_AUTO_PAN_MAX_SPEED = 18;
const NODE_DRAG_START_THRESHOLD = 4;

export const EDGE_DROP_INFLUENCE_RADIUS = 42;

export const getDragAutoPanDelta = (rect: DOMRect, clientX: number, clientY: number) => {
    const speedForDistance = (distance: number) => {
        if (distance >= DRAG_AUTO_PAN_EDGE_SIZE) return 0;
        return ((DRAG_AUTO_PAN_EDGE_SIZE - Math.max(0, distance)) / DRAG_AUTO_PAN_EDGE_SIZE) * DRAG_AUTO_PAN_MAX_SPEED;
    };

    return {
        x: speedForDistance(clientX - rect.left) - speedForDistance(rect.right - clientX),
        y: speedForDistance(clientY - rect.top) - speedForDistance(rect.bottom - clientY),
    };
};

export const hasMovedBeyondDragThreshold = (drag: NodeDragState, clientX: number, clientY: number) => {
    return Math.hypot(clientX - drag.startX, clientY - drag.startY) >= NODE_DRAG_START_THRESHOLD;
};

export const findEdgeDropTarget = (
    edges: CanvasEdge[],
    nodes: CanvasNode[],
    draggedNodeId: string,
    point: Point,
    influenceRadius: number,
): EdgeDropTarget | null => {
    let closestTarget: EdgeDropTarget | null = null;
    let closestDistance = influenceRadius;

    edges.forEach(edge => {
        if (edge.sourceNodeId === draggedNodeId || edge.targetNodeId === draggedNodeId) return;
        const sourceNode = nodes.find(node => node.id === edge.sourceNodeId);
        const targetNode = nodes.find(node => node.id === edge.targetNodeId);
        if (!sourceNode || !targetNode) return;

        const start = getPortPosition(sourceNode, edge.sourcePort ?? DEFAULT_OUTPUT_PORT, 'output');
        const end = getPortPosition(targetNode, edge.targetPort ?? DEFAULT_INPUT_PORT, 'input');
        const distance = getPointToPolylineDistance(point, getEdgePolyline(start, end));
        if (distance > closestDistance) return;

        const insertionLayout = getEdgeInsertionLayout(sourceNode, targetNode);
        closestTarget = {
            edgeId: edge.id,
            targetNodeId: edge.targetNodeId,
            x: insertionLayout.nodePosition.x,
            y: insertionLayout.nodePosition.y,
            targetShift: insertionLayout.targetShift,
        };
        closestDistance = distance;
    });

    return closestTarget;
};
