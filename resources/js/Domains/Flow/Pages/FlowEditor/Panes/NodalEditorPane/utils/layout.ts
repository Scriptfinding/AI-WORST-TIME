import type { CanvasEdge, CanvasNode, Point } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { getNodeOutputPorts } from './constants';
import { edgeSourcePort } from './edges';
import { CANVAS_GRID_SIZE, snapCanvasPosition } from './grid';

const SYSTEM_X = 0;
const RUN_Y = -5 * CANVAS_GRID_SIZE;
const TERMINATE_Y = 7 * CANVAS_GRID_SIZE;
const FIRST_COLUMN_X = 8 * CANVAS_GRID_SIZE;
const HORIZONTAL_GAP = 8 * CANVAS_GRID_SIZE;
const VERTICAL_GAP = 9 * CANVAS_GRID_SIZE;
// Keeps handle-based ordering subordinate to the parent node position: the max
// spread stays well below VERTICAL_GAP so it only breaks ties between siblings.
const PORT_ORDER_OFFSET = CANVAS_GRID_SIZE;

export const SYSTEM_RUN_POSITION = { x: SYSTEM_X, y: RUN_Y };
export const SYSTEM_TERMINATE_POSITION = { x: SYSTEM_X, y: TERMINATE_Y };

export type ArrangeGraphResult = {
    nodes: CanvasNode[];
    graphCenter: Point;
};

const groupNodesByDepth = (nodes: CanvasNode[], depthById: Map<string, number>) => {
    const columns = new Map<number, CanvasNode[]>();

    nodes.forEach(node => {
        const depth = depthById.get(node.id);
        if (depth === undefined) return;
        columns.set(depth, [...(columns.get(depth) ?? []), node]);
    });

    return columns;
};

export const arrangeGraph = (nodes: CanvasNode[], edges: CanvasEdge[]): ArrangeGraphResult => {
    const editableNodes = nodes.filter(node => !node.system && !node.scopeId && node.kind !== 'stickyNote');
    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, string[]>();
    const incomingEdges = new Map<string, CanvasEdge[]>();

    edges.forEach(edge => {
        outgoing.set(edge.sourceNodeId, [...(outgoing.get(edge.sourceNodeId) ?? []), edge.targetNodeId]);
        incoming.set(edge.targetNodeId, [...(incoming.get(edge.targetNodeId) ?? []), edge.sourceNodeId]);
        incomingEdges.set(edge.targetNodeId, [...(incomingEdges.get(edge.targetNodeId) ?? []), edge]);
    });

    const sourcePortOffset = (edge: CanvasEdge): number => {
        const sourceNode = nodeById.get(edge.sourceNodeId);
        if (!sourceNode || sourceNode.system) return 0;

        const outputPorts = getNodeOutputPorts(sourceNode.entry.name, sourceNode.entry);
        if (outputPorts.length <= 1) return 0;

        const portIndex = outputPorts.findIndex(port => port.id === edgeSourcePort(edge));
        if (portIndex < 0) return 0;

        return (portIndex - (outputPorts.length - 1) / 2) * PORT_ORDER_OFFSET;
    };

    const effectiveSourceY = (nodeId: string, fallbackY: number, arrangedYFor: (sourceNodeId: string) => number | undefined): number => {
        const parentEdges = incomingEdges.get(nodeId) ?? [];
        if (parentEdges.length === 0) return fallbackY;

        const total = parentEdges.reduce((sum, edge) => (
            sum + (arrangedYFor(edge.sourceNodeId) ?? fallbackY) + sourcePortOffset(edge)
        ), 0);

        return total / parentEdges.length;
    };

    const runNode = nodes.find(node => node.system === 'run')
        ?? nodes.find(node => node.system === 'function' && !node.scopeId);
    const terminateNode = nodes.find(node => node.system === 'terminate');
    const runNodeId = runNode?.id;
    const terminateNodeId = terminateNode?.id;
    const runY = runNode?.y ?? RUN_Y;
    const terminateY = terminateNode?.y ?? runY;
    const collectDepthsFromRoot = (rootNodeId: string | undefined, blockedNodeIds = new Set<string>()) => {
        const depthById = new Map<string, number>();
        const queue: string[] = rootNodeId ? [rootNodeId] : [];

        if (rootNodeId) depthById.set(rootNodeId, 0);

        while (queue.length > 0) {
            const currentId = queue.shift();
            if (!currentId) continue;
            const currentDepth = depthById.get(currentId) ?? 0;

            for (const nextId of outgoing.get(currentId) ?? []) {
                const nextNode = nodeById.get(nextId);
                if (!nextNode || nextNode.system || blockedNodeIds.has(nextId)) continue;
                const nextDepth = currentDepth + 1;
                const knownDepth = depthById.get(nextId);

                if (knownDepth === undefined || nextDepth < knownDepth) {
                    depthById.set(nextId, nextDepth);
                    queue.push(nextId);
                }
            }
        }

        return depthById;
    };

    const finallyDepthById = collectDepthsFromRoot(terminateNodeId);
    const finallyNodeIds = new Set(editableNodes.filter(node => finallyDepthById.has(node.id)).map(node => node.id));
    const depthById = collectDepthsFromRoot(runNodeId, finallyNodeIds);
    const reachableEditableNodes = editableNodes.filter(node => depthById.has(node.id));
    const finallyEditableNodes = editableNodes.filter(node => finallyDepthById.has(node.id));
    const columns = groupNodesByDepth(reachableEditableNodes, depthById);
    const finallyColumns = groupNodesByDepth(finallyEditableNodes, finallyDepthById);
    const arrangedEditableById = new Map<string, CanvasNode>();

    const arrangeColumns = (columnMap: Map<number, CanvasNode[]>, anchorY: number) => {
        [...columnMap.entries()]
            .sort(([a], [b]) => a - b)
            .forEach(([depth, columnNodes]) => {
                const sortedColumnNodes = [...columnNodes].sort((a, b) => {
                    const aSourceY = effectiveSourceY(a.id, anchorY, sourceNodeId => arrangedEditableById.get(sourceNodeId)?.y);
                    const bSourceY = effectiveSourceY(b.id, anchorY, sourceNodeId => arrangedEditableById.get(sourceNodeId)?.y);

                    if (aSourceY !== bSourceY) return aSourceY - bSourceY;
                    return a.entry.name.localeCompare(b.entry.name);
                });
                const columnHeight = (sortedColumnNodes.length - 1) * VERTICAL_GAP;

                sortedColumnNodes.forEach((node, index) => {
                    arrangedEditableById.set(node.id, {
                        ...node,
                        x: snapCanvasPosition(FIRST_COLUMN_X + (depth - 1) * HORIZONTAL_GAP),
                        y: snapCanvasPosition(anchorY - columnHeight / 2 + index * VERTICAL_GAP),
                    });
                });
            });
    };

    arrangeColumns(columns, runY);
    arrangeColumns(finallyColumns, terminateY);

    const isolatedNodes = editableNodes.filter(node => !depthById.has(node.id) && !finallyDepthById.has(node.id));
    const arrangedMainNodes = [...arrangedEditableById.values()];
    const mainBottomY = Math.max(terminateY, runY, ...arrangedMainNodes.map(node => node.y));
    const isolatedNodeIds = new Set(isolatedNodes.map(node => node.id));
    const visitedIsolatedNodeIds = new Set<string>();
    const isolatedComponents: CanvasNode[][] = [];

    const connectedIsolatedNodeIds = (nodeId: string) => [
        ...(outgoing.get(nodeId) ?? []),
        ...(incoming.get(nodeId) ?? []),
    ].filter(nextId => isolatedNodeIds.has(nextId));

    isolatedNodes.forEach(node => {
        if (visitedIsolatedNodeIds.has(node.id)) return;

        const componentIds: string[] = [];
        const componentQueue = [node.id];
        visitedIsolatedNodeIds.add(node.id);

        while (componentQueue.length > 0) {
            const currentId = componentQueue.shift();
            if (!currentId) continue;
            componentIds.push(currentId);

            connectedIsolatedNodeIds(currentId).forEach(nextId => {
                if (visitedIsolatedNodeIds.has(nextId)) return;
                visitedIsolatedNodeIds.add(nextId);
                componentQueue.push(nextId);
            });
        }

        isolatedComponents.push(componentIds.flatMap(id => {
            const componentNode = nodeById.get(id);
            return componentNode && !componentNode.system ? [componentNode] : [];
        }));
    });

    let isolatedLineY = mainBottomY + VERTICAL_GAP;
    isolatedComponents
        .sort((a, b) => {
            const aTop = Math.min(...a.map(node => node.y));
            const bTop = Math.min(...b.map(node => node.y));
            if (aTop !== bTop) return aTop - bTop;
            return Math.min(...a.map(node => node.x)) - Math.min(...b.map(node => node.x));
        })
        .forEach(component => {
            const componentIds = new Set(component.map(node => node.id));
            const roots = component.filter(node => !(incoming.get(node.id) ?? []).some(parentId => componentIds.has(parentId)));
            const componentDepthById = new Map<string, number>();
            const componentQueue = (roots.length > 0 ? roots : [...component].sort((a, b) => a.x - b.x)).map(node => node.id);

            componentQueue.forEach(nodeId => componentDepthById.set(nodeId, 0));

            while (componentQueue.length > 0) {
                const currentId = componentQueue.shift();
                if (!currentId) continue;
                const currentDepth = componentDepthById.get(currentId) ?? 0;

                (outgoing.get(currentId) ?? []).forEach(nextId => {
                    if (!componentIds.has(nextId)) return;
                    const nextDepth = currentDepth + 1;
                    const knownDepth = componentDepthById.get(nextId);

                    if (knownDepth === undefined || nextDepth < knownDepth) {
                        componentDepthById.set(nextId, nextDepth);
                        componentQueue.push(nextId);
                    }
                });
            }

            component.forEach(node => {
                if (!componentDepthById.has(node.id)) componentDepthById.set(node.id, 0);
            });

            const componentColumns = new Map<number, CanvasNode[]>();
            component.forEach(node => {
                const depth = componentDepthById.get(node.id) ?? 0;
                componentColumns.set(depth, [...(componentColumns.get(depth) ?? []), node]);
            });

            const maxColumnSize = Math.max(1, ...[...componentColumns.values()].map(columnNodes => columnNodes.length));
            const componentHeight = (maxColumnSize - 1) * VERTICAL_GAP;

            [...componentColumns.entries()]
                .sort(([a], [b]) => a - b)
                .forEach(([depth, columnNodes]) => {
                    const sortedColumnNodes = [...columnNodes].sort((a, b) => {
                        const aSourceY = effectiveSourceY(a.id, isolatedLineY, sourceNodeId => arrangedEditableById.get(sourceNodeId)?.y);
                        const bSourceY = effectiveSourceY(b.id, isolatedLineY, sourceNodeId => arrangedEditableById.get(sourceNodeId)?.y);

                        if (aSourceY !== bSourceY) return aSourceY - bSourceY;
                        return a.entry.name.localeCompare(b.entry.name);
                    });

                    sortedColumnNodes.forEach((node, index) => {
                        arrangedEditableById.set(node.id, {
                            ...node,
                            x: snapCanvasPosition(SYSTEM_X + depth * HORIZONTAL_GAP),
                            y: snapCanvasPosition(isolatedLineY - componentHeight / 2 + index * VERTICAL_GAP),
                        });
                    });
                });

            isolatedLineY += Math.max(VERTICAL_GAP, componentHeight + VERTICAL_GAP);
        });

    const localArrangedById = new Map<string, CanvasNode>();
    const mainTopY = Math.min(runY, ...arrangedMainNodes.map(node => node.y));
    let localFunctionsBottomY = mainTopY - VERTICAL_GAP;
    nodes
        .filter(node => node.system === 'function' && node.scopeId)
        .sort((a, b) => b.y - a.y || a.x - b.x || a.id.localeCompare(b.id))
        .forEach(functionNode => {
            const scopeId = functionNode.scopeId!;
            const scopeNodes = nodes.filter(node => node.scopeId === scopeId);
            const scopeNodeIds = new Set(scopeNodes.map(node => node.id));
            const depthById = new Map<string, number>([[functionNode.id, 0]]);
            const queue = [functionNode.id];
            while (queue.length > 0) {
                const nodeId = queue.shift();
                if (!nodeId) continue;
                const depth = depthById.get(nodeId) ?? 0;
                (outgoing.get(nodeId) ?? []).forEach(targetId => {
                    if (!scopeNodeIds.has(targetId) || depthById.has(targetId)) return;
                    depthById.set(targetId, depth + 1);
                    queue.push(targetId);
                });
            }
            const scopeColumns = new Map<number, CanvasNode[]>();
            scopeNodes.filter(node => !node.system && node.kind !== 'stickyNote').forEach(node => {
                const depth = depthById.get(node.id);
                if (depth === undefined) return;
                scopeColumns.set(depth, [...(scopeColumns.get(depth) ?? []), node]);
            });
            const componentHeight = Math.max(
                0,
                ...[...scopeColumns.values()].map(columnNodes => (columnNodes.length - 1) * VERTICAL_GAP),
            );
            const functionY = snapCanvasPosition(localFunctionsBottomY - componentHeight / 2);
            localFunctionsBottomY = functionY - componentHeight / 2 - VERTICAL_GAP;
            localArrangedById.set(functionNode.id, {
                ...functionNode,
                x: SYSTEM_X,
                y: functionY,
            });
            [...scopeColumns.entries()]
                .sort(([a], [b]) => a - b)
                .forEach(([depth, columnNodes]) => {
                    const sortedColumnNodes = [...columnNodes].sort((a, b) => {
                        const aSourceY = effectiveSourceY(a.id, functionY, sourceNodeId => localArrangedById.get(sourceNodeId)?.y);
                        const bSourceY = effectiveSourceY(b.id, functionY, sourceNodeId => localArrangedById.get(sourceNodeId)?.y);

                        if (aSourceY !== bSourceY) return aSourceY - bSourceY;
                        return a.entry.name.localeCompare(b.entry.name);
                    });
                    const columnHeight = (sortedColumnNodes.length - 1) * VERTICAL_GAP;

                    sortedColumnNodes.forEach((node, index) => {
                        localArrangedById.set(node.id, {
                            ...node,
                            x: snapCanvasPosition(SYSTEM_X + depth * HORIZONTAL_GAP),
                            y: snapCanvasPosition(functionY - columnHeight / 2 + index * VERTICAL_GAP),
                        });
                    });
                });
        });

    const mainMaxDepth = Math.max(0, ...columns.keys());
    const maxDepth = Math.max(1, mainMaxDepth, ...finallyColumns.keys());
    const arranged = nodes.map(node => {
        if (node.system === 'run' || (node.system === 'function' && !node.scopeId)) {
            return { ...node, x: SYSTEM_RUN_POSITION.x, y: runY };
        }

        if (node.system === 'terminate') {
            return { ...node, x: SYSTEM_TERMINATE_POSITION.x, y: terminateY };
        }

        return localArrangedById.get(node.id) ?? arrangedEditableById.get(node.id) ?? node;
    });

    const allArrangedNodes = [
        ...arrangedEditableById.values(),
        ...localArrangedById.values(),
    ];
    const editableYs = allArrangedNodes.map(node => node.y);
    const editableXs = allArrangedNodes.map(node => node.x);
    const graphCenter = {
        x: editableXs.length > 0
            ? (Math.min(SYSTEM_X, ...editableXs) + Math.max(SYSTEM_X, FIRST_COLUMN_X + (maxDepth - 1) * HORIZONTAL_GAP, ...editableXs)) / 2
            : SYSTEM_X,
        y: editableYs.length > 0
            ? (Math.min(runY, terminateY, ...editableYs) + Math.max(runY, terminateY, ...editableYs)) / 2
            : (runY + terminateY) / 2,
    };

    return { nodes: arranged, graphCenter };
};
