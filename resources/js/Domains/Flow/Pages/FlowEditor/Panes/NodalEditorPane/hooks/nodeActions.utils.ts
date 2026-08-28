import {
    connectEdgeWithStructuredJoins,
    edgeSourcePort,
    edgeTargetPort,
    normalizeStructuredEdges,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/edges';
import type {
    CanvasEdge,
    CanvasNode,
    NodeParameterValue,
    StickyNoteData,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';

const FREE_ADD_RANDOM_OFFSET = 120;

export type StickyNoteUpdate = Partial<StickyNoteData> & { x?: number; y?: number };

export const DEFAULT_STICKY_NOTE: StickyNoteData = {
    content: '### Sticky note\n\nWrite markdown here.',
    color: 'yellow',
    width: 260,
    height: 180,
};

export function randomCanvasOffset() {
    return (Math.random() - 0.5) * FREE_ADD_RANDOM_OFFSET * 2;
}

export function reconnectDeletedLinearNodes(nodes: CanvasNode[], edges: CanvasEdge[], removableIds: Set<string>) {
    const nextEdges = edges.filter(edge => !removableIds.has(edge.sourceNodeId) && !removableIds.has(edge.targetNodeId));
    const remainingNodes = nodes.filter(node => !removableIds.has(node.id));

    const incomingBoundaryEdges = edges.filter(edge => (
        !removableIds.has(edge.sourceNodeId) && removableIds.has(edge.targetNodeId)
    ));

    incomingBoundaryEdges.forEach(incomingEdge => {
        const queue = [incomingEdge.targetNodeId];
        const visited = new Set<string>();
        const outgoingBoundaryEdges: CanvasEdge[] = [];

        while (queue.length > 0) {
            const nodeId = queue.shift();
            if (!nodeId || visited.has(nodeId)) continue;
            visited.add(nodeId);

            edges.filter(edge => edge.sourceNodeId === nodeId).forEach(edge => {
                if (removableIds.has(edge.targetNodeId)) {
                    queue.push(edge.targetNodeId);
                } else {
                    outgoingBoundaryEdges.push(edge);
                }
            });
        }

        if (outgoingBoundaryEdges.length !== 1) return;
        const [outgoingEdge] = outgoingBoundaryEdges;
        if (!outgoingEdge || incomingEdge.sourceNodeId === outgoingEdge.targetNodeId) return;

        const sourcePort = edgeSourcePort(incomingEdge);
        const targetPort = edgeTargetPort(outgoingEdge);
        const candidateEdge = {
            id: `${incomingEdge.sourceNodeId}:${sourcePort}->${outgoingEdge.targetNodeId}:${targetPort}`,
            sourceNodeId: incomingEdge.sourceNodeId,
            targetNodeId: outgoingEdge.targetNodeId,
            sourcePort,
            targetPort,
        };
        const connectedEdges = connectEdgeWithStructuredJoins(
            remainingNodes,
            nextEdges,
            candidateEdge,
        );
        if (connectedEdges === nextEdges) return;
        nextEdges.splice(0, nextEdges.length, ...connectedEdges);
    });

    // Deleting a split node (e.g. an IF) can leave its former join with orphaned
    // multi-input edges; drop the edges that no longer form a structured graph.
    return normalizeStructuredEdges(remainingNodes, nextEdges);
}

function remapOutputReferences(source: string, idMap: Map<string, string>) {
    let nextSource = source;

    idMap.forEach((nextNodeId, previousNodeId) => {
        const escapedPreviousNodeId = previousNodeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        nextSource = nextSource
            .replace(new RegExp(`\\$nodes\\s*\\[\\s*"${escapedPreviousNodeId}"\\s*\\]`, 'g'), `$nodes[${JSON.stringify(nextNodeId)}]`)
            .replace(new RegExp(`\\$nodes\\s*\\[\\s*'${escapedPreviousNodeId}'\\s*\\]`, 'g'), `$nodes[${JSON.stringify(nextNodeId)}]`)
            .replace(new RegExp(`\\$output\\s*\\[\\s*"${escapedPreviousNodeId}"\\s*\\]`, 'g'), `$nodes[${JSON.stringify(nextNodeId)}]`)
            .replace(new RegExp(`\\$output\\s*\\[\\s*'${escapedPreviousNodeId}'\\s*\\]`, 'g'), `$nodes[${JSON.stringify(nextNodeId)}]`);

        if (/^[a-zA-Z_$][\w$]*$/.test(previousNodeId)) {
            nextSource = nextSource
                .replace(new RegExp(`\\$nodes\\.${escapedPreviousNodeId}\\b`, 'g'), `$nodes[${JSON.stringify(nextNodeId)}]`)
                .replace(new RegExp(`\\$output\\.${escapedPreviousNodeId}\\b`, 'g'), `$nodes[${JSON.stringify(nextNodeId)}]`);
        }
    });

    return nextSource;
}

function remapNodeValueReferences(
    value: NodeParameterValue,
    idMap: Map<string, string>,
): NodeParameterValue {
    if (value.mode === 'fixed' || value.mode === 'expression') {
        return { ...value, value: remapOutputReferences(value.value, idMap) };
    }

    if (value.mode === 'if-condition') {
        return {
            ...value,
            rules: value.rules.map(rule => ({
                ...rule,
                left: remapNodeValueReferences(rule.left, idMap) as typeof rule.left,
                right: rule.right
                    ? remapNodeValueReferences(rule.right, idMap) as typeof rule.right
                    : undefined,
            })),
        };
    }

    if (value.mode !== 'object') {
        return { ...value, value: remapOutputReferences(value.value, idMap) };
    }

    return {
        ...value,
        value: remapOutputReferences(value.value, idMap),
        fields: value.fields.map(field => ({
            ...field,
            value: remapNodeValueReferences(field.value, idMap),
        })),
    };
}

export function remapNodeValuesReferences(
    values: Record<string, NodeParameterValue>,
    idMap: Map<string, string>,
) {
    return Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, remapNodeValueReferences(value, idMap)]),
    );
}
