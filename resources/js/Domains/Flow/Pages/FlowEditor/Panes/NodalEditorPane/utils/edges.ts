import type { CanvasEdge, CanvasNode, Point } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { DEFAULT_INPUT_PORT, DEFAULT_OUTPUT_PORT } from './constants';
import { snapCanvasPoint } from './grid';

const EDGE_INSERTION_MIN_HORIZONTAL_DISTANCE = 432;

export type EdgeDropTarget = {
    edgeId: string;
    targetNodeId: string;
    x: number;
    y: number;
    targetShift?: Point;
};

export function edgeSourcePort(edge: Pick<CanvasEdge, 'sourcePort'>): string {
    return edge.sourcePort ?? DEFAULT_OUTPUT_PORT;
}

export function edgeTargetPort(edge: Pick<CanvasEdge, 'targetPort'>): string {
    return edge.targetPort ?? DEFAULT_INPUT_PORT;
}

export function hasAvailableHandlesForEdge(edges: CanvasEdge[], sourceNodeId: string, sourcePort: string, targetNodeId: string, targetPort: string, ignoredEdgeId?: string): boolean {
    return !edges.some(edge => edge.id !== ignoredEdgeId && (
        (edge.sourceNodeId === sourceNodeId && edgeSourcePort(edge) === sourcePort)
        || (edge.targetNodeId === targetNodeId && edgeTargetPort(edge) === targetPort)
    ));
}

export function edgeConflictsWithHandles(edge: CanvasEdge, sourceNodeId: string, sourcePort: string, targetNodeId: string, targetPort: string, ignoredEdgeId?: string): boolean {
    return edge.id !== ignoredEdgeId && (
        (edge.sourceNodeId === sourceNodeId && edgeSourcePort(edge) === sourcePort)
        || (edge.targetNodeId === targetNodeId && edgeTargetPort(edge) === targetPort)
    );
}

const collectSystemFlowNodeIds = (
    nodes: CanvasNode[],
    edges: CanvasEdge[],
    system: NonNullable<CanvasNode['system']>,
): Set<string> => {
    const rootNode = nodes.find(node => node.system === system);
    if (!rootNode) return new Set();

    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const nodeIds = new Set([rootNode.id]);
    const queue = [rootNode.id];

    while (queue.length > 0) {
        const nodeId = queue.shift();
        if (!nodeId) continue;

        edges
            .filter(edge => edge.sourceNodeId === nodeId)
            .forEach(edge => {
                const targetNode = nodeById.get(edge.targetNodeId);
                if (!targetNode || (targetNode.system && targetNode.id !== rootNode.id) || nodeIds.has(targetNode.id)) return;
                nodeIds.add(targetNode.id);
                queue.push(targetNode.id);
            });
    }

    return nodeIds;
};

export function connectsSeparateSystemFlows(
    nodes: CanvasNode[],
    edges: CanvasEdge[],
    sourceNodeId: string,
    targetNodeId: string,
): boolean {
    const runNodeIds = collectSystemFlowNodeIds(nodes, edges, 'run');
    const terminateNodeIds = collectSystemFlowNodeIds(nodes, edges, 'terminate');

    return (runNodeIds.has(sourceNodeId) && terminateNodeIds.has(targetNodeId))
        || (terminateNodeIds.has(sourceNodeId) && runNodeIds.has(targetNodeId));
}

export function collectDownstreamNodeIds(edges: CanvasEdge[], startNodeId: string, excludedNodeIds = new Set<string>()): Set<string> {
    const downstreamNodeIds = new Set<string>();
    const queue = [startNodeId];

    while (queue.length) {
        const nodeId = queue.shift();
        if (!nodeId || downstreamNodeIds.has(nodeId) || excludedNodeIds.has(nodeId)) continue;

        downstreamNodeIds.add(nodeId);
        edges.forEach(edge => {
            if (edge.sourceNodeId === nodeId && !downstreamNodeIds.has(edge.targetNodeId)) {
                queue.push(edge.targetNodeId);
            }
        });
    }

    return downstreamNodeIds;
}

export function getEdgeInsertionLayout(sourceNode: CanvasNode, targetNode: CanvasNode) {
    const direction = targetNode.x >= sourceNode.x ? 1 : -1;
    const horizontalDistance = Math.abs(targetNode.x - sourceNode.x);
    const targetPush = Math.max(0, EDGE_INSERTION_MIN_HORIZONTAL_DISTANCE - horizontalDistance);
    const adjustedTarget = targetPush > 0
        ? snapCanvasPoint({ x: targetNode.x + direction * targetPush, y: targetNode.y })
        : snapCanvasPoint({ x: targetNode.x, y: targetNode.y });
    const targetShift = {
        x: adjustedTarget.x - targetNode.x,
        y: adjustedTarget.y - targetNode.y,
    };

    return {
        nodePosition: snapCanvasPoint({
            x: (sourceNode.x + adjustedTarget.x) / 2,
            y: sourceNode.y,
        }),
        targetShift,
    };
}
