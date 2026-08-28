import type { CanvasEdge, CanvasNode, Point } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import {
    DEFAULT_INPUT_PORT,
    DEFAULT_OUTPUT_PORT,
    isConditionalBranchNodeName,
    LOOP_NODE_NAME,
    MERGE_NODE_NAME,
} from './constants';
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

type TopologyNode = Pick<CanvasNode, 'id' | 'entry' | 'scopeId'> | {
    id: string;
    name: string;
    scopeId?: string;
};

type Topology = {
    nodes: Map<string, TopologyNode>;
    outgoing: Map<string, CanvasEdge[]>;
    incoming: Map<string, CanvasEdge[]>;
    edgeByOutput: Map<string, CanvasEdge>;
};

export type StructuredGraphAnalysis = {
    valid: boolean;
    joinsByIfNodeId: Map<string, string>;
    joinsByBranchPort: Map<string, string>;
};

const nodeName = (node: TopologyNode): string => 'name' in node ? node.name : node.entry.name;
const outputKey = (nodeId: string, port: string) => `${nodeId}\0${port}`;

const buildTopology = (nodes: TopologyNode[], edges: CanvasEdge[]) => {
    const topology: Topology = {
        nodes: new Map(nodes.map(node => [node.id, node])),
        outgoing: new Map(),
        incoming: new Map(),
        edgeByOutput: new Map(),
    };
    let valid = true;

    edges.forEach(edge => {
        const source = topology.nodes.get(edge.sourceNodeId);
        const target = topology.nodes.get(edge.targetNodeId);
        const key = outputKey(edge.sourceNodeId, edgeSourcePort(edge));
        if (
            !source
            || !target
            || source.id === target.id
            || (source.scopeId ?? null) !== (target.scopeId ?? null)
            || topology.edgeByOutput.has(key)
        ) valid = false;

        topology.edgeByOutput.set(key, edge);
        topology.outgoing.set(edge.sourceNodeId, [...(topology.outgoing.get(edge.sourceNodeId) ?? []), edge]);
        topology.incoming.set(edge.targetNodeId, [...(topology.incoming.get(edge.targetNodeId) ?? []), edge]);
    });

    return { topology, valid };
};

const executionOutgoing = (topology: Topology, nodeId: string): CanvasEdge[] => {
    const outgoing = topology.outgoing.get(nodeId) ?? [];
    const node = topology.nodes.get(nodeId);
    if (!node) return [];
    const name = nodeName(node);
    if (isConditionalBranchNodeName(name)) {
        return outgoing.filter(edge => ['true', 'false'].includes(edgeSourcePort(edge)));
    }
    if (name === LOOP_NODE_NAME) {
        return outgoing.filter(edge => edgeSourcePort(edge) === 'done');
    }
    return outgoing.filter(edge => !edgeSourcePort(edge).startsWith('flow-'));
};

const reachable = (topology: Topology, start: string | null, stop?: string, includeBranches = false): Set<string> => {
    const seen = new Set<string>();
    const queue = start ? [start] : [];
    for (let index = 0; index < queue.length; index++) {
        const nodeId = queue[index];
        if (!nodeId || nodeId === stop || seen.has(nodeId)) continue;
        seen.add(nodeId);
        const outgoing = includeBranches ? topology.outgoing.get(nodeId) ?? [] : executionOutgoing(topology, nodeId);
        outgoing.forEach(edge => queue.push(edge.targetNodeId));
    }
    return seen;
};

const firstCommonJoin = (topology: Topology, left: string | null, right: string | null): string | null => {
    if (!left || !right) return null;
    if (left === right) return left;
    const rightNodes = reachable(topology, right);
    const queue = [left];
    const seen = new Set<string>();
    for (let index = 0; index < queue.length; index++) {
        const nodeId = queue[index];
        if (!nodeId || seen.has(nodeId)) continue;
        if (rightNodes.has(nodeId)) return nodeId;
        seen.add(nodeId);
        executionOutgoing(topology, nodeId).forEach(edge => queue.push(edge.targetNodeId));
    }
    return null;
};

const everyPathReaches = (topology: Topology, start: string | null, join: string): boolean => {
    if (!start) return false;
    const memo = new Map<string, boolean>();
    const visit = (nodeId: string): boolean => {
        if (nodeId === join) return true;
        if (memo.has(nodeId)) return memo.get(nodeId) ?? false;
        const outgoing = executionOutgoing(topology, nodeId);
        if (outgoing.length === 0) return false;
        memo.set(nodeId, false);
        const result = outgoing.every(edge => visit(edge.targetNodeId));
        memo.set(nodeId, result);
        return result;
    };
    return visit(start);
};

export function analyzeStructuredGraph(nodes: TopologyNode[], edges: CanvasEdge[]): StructuredGraphAnalysis {
    const { topology, valid: indexedGraphIsValid } = buildTopology(nodes, edges);
    let valid = indexedGraphIsValid;
    const joinsByIfNodeId = new Map<string, string>();
    const joinsByBranchPort = new Map<string, string>();
    const allowedPortsByJoin = new Map<string, Map<string, Set<string>>>();
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const hasCycle = (nodeId: string): boolean => {
        if (visiting.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;
        visiting.add(nodeId);
        const cyclic = (topology.outgoing.get(nodeId) ?? []).some(edge => hasCycle(edge.targetNodeId));
        visiting.delete(nodeId);
        visited.add(nodeId);
        return cyclic;
    };
    if ([...topology.nodes.keys()].some(hasCycle)) valid = false;

    const registerSplit = (node: TopologyNode, ports: string[], forcedJoin?: string | null) => {
        const starts = ports.map(port => topology.edgeByOutput.get(outputKey(node.id, port))?.targetNodeId ?? null);
        const join = forcedJoin === undefined ? firstCommonJoin(topology, starts[0] ?? null, starts[1] ?? null) : forcedJoin;
        if (!join || starts.some(start => !everyPathReaches(topology, start, join))) return;

        const owners = allowedPortsByJoin.get(join) ?? new Map<string, Set<string>>();
        const ownedPorts = owners.get(node.id) ?? new Set<string>();
        ports.forEach(port => ownedPorts.add(port));
        owners.set(node.id, ownedPorts);
        allowedPortsByJoin.set(join, owners);
        ports.forEach(port => joinsByBranchPort.set(outputKey(node.id, port), join));
        if (isConditionalBranchNodeName(nodeName(node))) joinsByIfNodeId.set(node.id, join);
    };

    topology.nodes.forEach(node => {
        const name = nodeName(node);
        if (isConditionalBranchNodeName(name)) {
            registerSplit(node, ['true', 'false']);
        } else if (name === LOOP_NODE_NAME) {
            registerSplit(
                node,
                ['loop', 'done'],
                topology.edgeByOutput.get(outputKey(node.id, 'done'))?.targetNodeId ?? null,
            );
        } else {
            (topology.outgoing.get(node.id) ?? [])
                .map(edgeSourcePort)
                .filter(port => port.startsWith('flow-'))
                .forEach(port => registerSplit(node, [DEFAULT_OUTPUT_PORT, port]));
        }
    });

    topology.incoming.forEach((incoming, targetNodeId) => {
        const target = topology.nodes.get(targetNodeId);
        if (incoming.length <= 1 || (target && nodeName(target) === MERGE_NODE_NAME)) return;
        const owners = [...(allowedPortsByJoin.get(targetNodeId)?.entries() ?? [])];
        const ownersAreNested = owners.every(([ownerId], index) => owners
            .slice(index + 1)
            .every(([otherOwnerId]) => (
                reachable(topology, ownerId, undefined, true).has(otherOwnerId)
                || reachable(topology, otherOwnerId, undefined, true).has(ownerId)
            )));
        const expectedIncoming = 1 + owners.reduce((count, [, ports]) => count + ports.size - 1, 0);
        if (owners.length === 0 || !ownersAreNested || incoming.length !== expectedIncoming) valid = false;
    });

    return { valid, joinsByIfNodeId, joinsByBranchPort };
}

export const structuredBranchKey = outputKey;

export function replaceEdgesWithStructuredJoins(
    nodes: TopologyNode[],
    edges: CanvasEdge[],
    additions: CanvasEdge[],
    removeIds = new Set<string>(),
): CanvasEdge[] {
    const base = edges.filter(edge => (
        !removeIds.has(edge.id)
        && !additions.some(addition => (
            edge.sourceNodeId === addition.sourceNodeId
            && edgeSourcePort(edge) === edgeSourcePort(addition)
        ))
    ));
    const appended = [...base, ...additions];
    if (analyzeStructuredGraph(nodes, appended).valid) return appended;

    if (additions.some(addition => base.filter(edge => edge.targetNodeId === addition.targetNodeId).length >= 2)) {
        return edges;
    }
    const replaced = [
        ...base.filter(edge => !additions.some(addition => edge.targetNodeId === addition.targetNodeId)),
        ...additions,
    ];
    return analyzeStructuredGraph(nodes, replaced).valid ? replaced : edges;
}

export function connectEdgeWithStructuredJoins(
    nodes: TopologyNode[],
    edges: CanvasEdge[],
    edge: CanvasEdge,
): CanvasEdge[] {
    return replaceEdgesWithStructuredJoins(nodes, edges, [edge]);
}

export function insertNodeIntoEdge(
    nodes: TopologyNode[],
    edges: CanvasEdge[],
    replacedEdge: CanvasEdge,
    nodeId: string,
    nodeOutputPort: string,
): CanvasEdge[] {
    const sourcePort = edgeSourcePort(replacedEdge);
    const targetPort = edgeTargetPort(replacedEdge);
    return replaceEdgesWithStructuredJoins(nodes, edges, [
        {
            id: `${replacedEdge.sourceNodeId}:${sourcePort}->${nodeId}:${DEFAULT_INPUT_PORT}`,
            sourceNodeId: replacedEdge.sourceNodeId,
            targetNodeId: nodeId,
            sourcePort,
            targetPort: DEFAULT_INPUT_PORT,
        },
        {
            id: `${nodeId}:${nodeOutputPort}->${replacedEdge.targetNodeId}:${targetPort}`,
            sourceNodeId: nodeId,
            targetNodeId: replacedEdge.targetNodeId,
            sourcePort: nodeOutputPort,
            targetPort,
        },
    ], new Set([replacedEdge.id]));
}

export function normalizeStructuredEdges(nodes: TopologyNode[], edges: CanvasEdge[]): CanvasEdge[] {
    if (analyzeStructuredGraph(nodes, edges).valid) return edges;
    return edges.reduce<CanvasEdge[]>((accepted, edge) => (
        connectEdgeWithStructuredJoins(nodes, accepted, edge)
    ), []);
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
