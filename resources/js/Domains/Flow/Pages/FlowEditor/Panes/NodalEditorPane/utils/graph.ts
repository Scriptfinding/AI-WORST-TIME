import {
    DEFAULT_INPUT_PORT,
    DEFAULT_OUTPUT_PORT,
    NODE_RUN_OUTPUT_KEY,
    STICKY_NOTE_ENTRY,
    STICKY_NOTE_NODE_NAME,
    SYSTEM_NODE_ENTRIES,
} from './constants';
import { formatEntryLabel, formatNodeLabel, getEntryByName } from './catalog';
import { cloneNodeValues } from './expression';
import { sanitizeNodeValuesForEntry } from './nodeValues';
import { uniqueNodeLabel } from './node';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import type {
    CanvasEdge,
    CanvasNode,
    GraphSnapshot,
    NodalGraph,
    NodalSystemNode,
    RawNodeParameterValue,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';

type ClipboardNode = {
    id: string;
    name: string;
    kind?: 'stickyNote';
    deactivated?: boolean;
    label?: string;
    x: number;
    y: number;
    values?: Record<string, RawNodeParameterValue>;
    system?: NodalSystemNode;
    callArguments?: string[];
    scopeId?: string;
    localFunctionId?: string;
    stickyNote?: CanvasNode['stickyNote'];
};

type ClipboardEdge = {
    id?: string;
    sourceNodeId: string;
    targetNodeId: string;
    sourcePort?: string;
    targetPort?: string;
};

const dynamicCallEntry = (node: NodalGraph['nodes'][number]): HelpEntryDef | null => {
    const args = node.callArguments?.length
        ? node.callArguments
        : Object.keys(node.values ?? {}).filter(key => key !== NODE_RUN_OUTPUT_KEY);
    const signature = `${node.name}(${args.join(', ')})`;

    if (node.localFunctionId) {
        return {
            name: node.name,
            signature,
            desc: `Call the private ${formatNodeLabel(node.name)} function.`,
            category: 'Functions',
            localFunctionId: node.localFunctionId,
        };
    }
    if (node.name.startsWith('$$')) {
        return {
            name: node.name,
            signature,
            desc: 'Call a reusable snippet.',
            displayLabel: 'Snippet',
            category: 'Snippets',
        };
    }

    return null;
};

export const graphToCanvasNodes = (graph: NodalGraph): CanvasNode[] => {
    return graph.nodes.reduce<CanvasNode[]>((acc, node) => {
        const isStickyNote = node.kind === 'stickyNote';
        const entry = isStickyNote
            ? STICKY_NOTE_ENTRY
            : node.system
                ? SYSTEM_NODE_ENTRIES[node.system]
                : dynamicCallEntry(node) ?? getEntryByName(node.name);
        const fallbackLabel = node.localFunctionId
            ? `Call ${formatNodeLabel(node.name)}`
            : formatEntryLabel(entry);
        const savedLabel = node.name === '$aiControl' && node.label?.trim() === 'Ai Control'
            ? 'AI Control'
            : node.label?.trim();
        const nextNode: CanvasNode = {
            id: node.id,
            entry,
            kind: isStickyNote ? 'stickyNote' : undefined,
            deactivated: node.deactivated,
            label: isStickyNote || node.system ? node.label : uniqueNodeLabel(savedLabel || fallbackLabel, acc),
            x: node.x,
            y: node.y,
            values: sanitizeNodeValuesForEntry(entry, node.values),
            system: node.system,
            callArguments: node.callArguments,
            scopeId: node.scopeId,
            localFunctionId: node.localFunctionId,
            stickyNote: isStickyNote ? {
                content: node.stickyNote?.content ?? '',
                color: node.stickyNote?.color ?? 'yellow',
                width: Math.max(180, node.stickyNote?.width ?? 260),
                height: Math.max(120, node.stickyNote?.height ?? 180),
            } : undefined,
        };

        return [...acc, nextNode];
    }, []);
};

export const canvasToNodalGraph = (nodes: CanvasNode[], edges: CanvasEdge[]): NodalGraph => ({
    nodes: nodes.map(node => ({
        id: node.id,
        name: node.kind === 'stickyNote' ? STICKY_NOTE_NODE_NAME : node.entry.name,
        kind: node.kind,
        deactivated: node.deactivated,
        label: node.label,
        x: node.x,
        y: node.y,
        values: sanitizeNodeValuesForEntry(node.entry, node.values),
        system: node.system,
        callArguments: node.callArguments,
        scopeId: node.scopeId,
        localFunctionId: node.localFunctionId,
        stickyNote: node.stickyNote,
    })),
    edges: edges
        .filter(edge => {
            const sourceNode = nodes.find(node => node.id === edge.sourceNodeId);
            const targetNode = nodes.find(node => node.id === edge.targetNodeId);
            return sourceNode?.kind !== 'stickyNote' && targetNode?.kind !== 'stickyNote';
        })
        .map(edge => ({
            ...edge,
            sourcePort: edge.sourcePort ?? DEFAULT_OUTPUT_PORT,
            targetPort: edge.targetPort ?? DEFAULT_INPUT_PORT,
        })),
});

export const cloneSnapshot = (snapshot: GraphSnapshot): GraphSnapshot => ({
    nodes: snapshot.nodes.map(node => ({
        ...node,
        values: cloneNodeValues(node.values),
        stickyNote: node.stickyNote ? { ...node.stickyNote } : undefined,
    })),
    edges: snapshot.edges.map(edge => ({ ...edge })),
});

export const parseClipboardGraph = (raw: string): NodalGraph | null => {
    try {
        const parsed = JSON.parse(raw);
        const candidate = Array.isArray(parsed?.nodes) && Array.isArray(parsed?.edges)
            ? parsed
            : Array.isArray(parsed?.graph?.nodes) && Array.isArray(parsed?.graph?.edges)
                ? parsed.graph
                : null;
        if (!candidate) return null;

        const graphNodes = candidate.nodes
            .filter((node: unknown) => {
                return Boolean(node)
                    && typeof node === 'object'
                    && typeof (node as { id?: unknown }).id === 'string'
                    && typeof (node as { name?: unknown }).name === 'string'
                    && typeof (node as { x?: unknown }).x === 'number'
                    && typeof (node as { y?: unknown }).y === 'number';
            })
            .map((node: ClipboardNode) => ({
                id: node.id,
                name: node.kind === 'stickyNote' ? STICKY_NOTE_NODE_NAME : node.name,
                kind: node.kind,
                deactivated: node.deactivated,
                label: node.label,
                x: node.x,
                y: node.y,
                values: sanitizeNodeValuesForEntry(getEntryByName(node.name), node.values),
                system: node.system,
                callArguments: node.callArguments,
                scopeId: node.scopeId,
                localFunctionId: node.localFunctionId,
                stickyNote: node.kind === 'stickyNote' ? node.stickyNote : undefined,
            }))
            .filter((node: ClipboardNode) => !node.system);

        if (graphNodes.length === 0) return null;

        const allowedIds = new Set(graphNodes.map((node: { id: string }) => node.id));
        const graphEdges = candidate.edges
            .filter((edge: unknown) => {
                return Boolean(edge)
                    && typeof edge === 'object'
                    && typeof (edge as { sourceNodeId?: unknown }).sourceNodeId === 'string'
                    && typeof (edge as { targetNodeId?: unknown }).targetNodeId === 'string'
                    && allowedIds.has((edge as { sourceNodeId: string }).sourceNodeId)
                    && allowedIds.has((edge as { targetNodeId: string }).targetNodeId);
            })
            .map((edge: ClipboardEdge) => ({
                id: edge.id ?? `${edge.sourceNodeId}:${edge.sourcePort ?? DEFAULT_OUTPUT_PORT}->${edge.targetNodeId}:${edge.targetPort ?? DEFAULT_INPUT_PORT}`,
                sourceNodeId: edge.sourceNodeId,
                targetNodeId: edge.targetNodeId,
                sourcePort: edge.sourcePort ?? DEFAULT_OUTPUT_PORT,
                targetPort: edge.targetPort ?? DEFAULT_INPUT_PORT,
            }));

        return { nodes: graphNodes, edges: graphEdges };
    } catch {
        return null;
    }
};
