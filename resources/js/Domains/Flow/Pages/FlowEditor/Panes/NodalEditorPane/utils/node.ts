import type { CanvasEdge, CanvasNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { getNodeInputPorts, getNodeOutputPorts } from './constants';
import { formatEntryLabel } from './catalog';

export const EMPTY_OUTPUT_PORT_SET: ReadonlySet<string> = new Set();

export function canDeactivateNode(node: CanvasNode): boolean {
    return !node.system
        && node.kind !== 'stickyNote';
}

export function shouldDeactivateNodes(nodes: readonly CanvasNode[]): boolean {
    const deactivatedCount = nodes.filter(node => node.deactivated).length;
    const activatedCount = nodes.length - deactivatedCount;

    return activatedCount > deactivatedCount;
}

export function getConnectedOutputPortsByNode(edges: CanvasEdge[]): Map<string, ReadonlySet<string>> {
    const portsByNode = new Map<string, Set<string>>();
    for (const edge of edges) {
        let ports = portsByNode.get(edge.sourceNodeId);
        if (!ports) {
            ports = new Set();
            portsByNode.set(edge.sourceNodeId, ports);
        }
        ports.add(edge.sourcePort ?? 'output');
    }

    return portsByNode;
}

export function isSingleHandleNode(node: CanvasNode): boolean {
    return !node.system
        && getNodeInputPorts(node.entry.name).length === 1
        && getNodeOutputPorts(node.entry.name, node.entry).length === 1;
}

export function isEdgeInsertableNode(node: CanvasNode): boolean {
    return !node.system
        && getNodeInputPorts(node.entry.name).length === 1
        && getNodeOutputPorts(node.entry.name, node.entry).length > 0;
}

export function primaryNodeOutputPort(node: CanvasNode): string | null {
    return getNodeOutputPorts(node.entry.name, node.entry)[0]?.id ?? null;
}

export function nodeDisplayLabel(node: Pick<CanvasNode, 'entry' | 'label'>): string {
    return node.label?.trim() || formatEntryLabel(node.entry);
}

export function uniqueNodeLabel(baseLabel: string, nodes: Pick<CanvasNode, 'id' | 'entry' | 'label'>[], ignoredNodeId?: string): string {
    const base = baseLabel.trim() || 'Node';
    const usedLabels = new Set(
        nodes
            .filter(node => node.id !== ignoredNodeId)
            .map(node => nodeDisplayLabel(node).toLowerCase()),
    );

    if (!usedLabels.has(base.toLowerCase())) return base;

    const numberedLabel = base.match(/^(.*)-(\d+)$/);
    const labelRoot = numberedLabel?.[1] || base;
    let suffix = numberedLabel ? Number(numberedLabel[2]) + 1 : 1;
    while (usedLabels.has(`${labelRoot}-${suffix}`.toLowerCase())) suffix += 1;
    return `${labelRoot}-${suffix}`;
}
