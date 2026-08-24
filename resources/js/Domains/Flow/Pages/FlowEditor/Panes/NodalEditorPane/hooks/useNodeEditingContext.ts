import { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import type { PageProps } from '@/App/types';
import type { Flow } from '@/Domains/Flow/types';
import { unavailableOutputPlaceholder } from '@/Domains/Flow/Pages/FlowEditor/utils/outputPreview';
import { analyzeNodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import { SYSTEM_TERMINATE_POSITION } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/layout';
import { getNodeSiteUrl } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/site';
import type { CanvasEdge, CanvasNode, NodalGraph, NodalGraphContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const withoutContext = (value: Record<string, unknown> | null) => {
    if (!value) return null;

    const { $context: _context, ...rest } = value;
    return rest;
};

const withoutRuntimeInputs = (value: Record<string, unknown> | null) => {
    if (!value) return null;

    const {
        viewportWidth: _viewportWidth,
        viewportHeight: _viewportHeight,
        $viewportWidth: _$viewportWidth,
        $viewportHeight: _$viewportHeight,
        $keyboardSpeed: _$keyboardSpeed,
        ...rest
    } = value;
    return rest;
};

const buildPreviewDefaultInputs = (
    flow: Flow,
    hasRealFlowContext: boolean,
    workspaceDefaults: { keyboardSpeed: number; viewportWidth: number; viewportHeight: number },
) => {
    const defaultInputs = flow.default_inputs ?? {};
    const latestInput = isRecord(flow.latest_run?.input) ? flow.latest_run.input : null;
    const latestOutput = isRecord(flow.latest_run?.output) ? flow.latest_run.output : null;
    const latestOutputInput = isRecord(latestOutput?.$input) ? latestOutput.$input : null;
    const defaultContext = isRecord(defaultInputs.$context) ? defaultInputs.$context : null;
    const latestInputContext = isRecord(latestInput?.$context) ? latestInput.$context : null;
    const latestOutputContext = isRecord(latestOutput?.$context) ? latestOutput.$context : null;
    const previewInputData = {
        ...withoutContext(defaultInputs),
        ...withoutContext(latestInput),
        ...(latestOutputInput ?? {}),
    };
    const configuredKeyboardSpeed = Number(previewInputData.$keyboardSpeed);
    const keyboardSpeed = Number.isFinite(configuredKeyboardSpeed) && configuredKeyboardSpeed >= 0
        ? configuredKeyboardSpeed
        : flow.keyboard_speed ?? workspaceDefaults.keyboardSpeed;
    const configuredViewportWidth = Number(previewInputData.$viewportWidth);
    const viewportWidth = Number.isFinite(configuredViewportWidth) && configuredViewportWidth > 0
        ? configuredViewportWidth
        : flow.viewport_width ?? workspaceDefaults.viewportWidth;
    const configuredViewportHeight = Number(previewInputData.$viewportHeight);
    const viewportHeight = Number.isFinite(configuredViewportHeight) && configuredViewportHeight > 0
        ? configuredViewportHeight
        : flow.viewport_height ?? workspaceDefaults.viewportHeight;
    const context: Record<string, unknown> = {
        flow_id: flow.id,
        ...(withoutRuntimeInputs(defaultContext) ?? {}),
        ...(withoutRuntimeInputs(latestInputContext) ?? {}),
        ...(withoutRuntimeInputs(latestOutputContext) ?? {}),
    };
    if (!hasRealFlowContext) {
        context.flow_id = unavailableOutputPlaceholder;
    }
    const previewInputs = {
        ...previewInputData,
        $keyboardSpeed: keyboardSpeed,
        $viewportWidth: viewportWidth,
        $viewportHeight: viewportHeight,
        ...(Object.keys(context).length > 0 ? { $context: context } : {}),
    };

    return Object.keys(previewInputs).length > 0 ? previewInputs : null;
};

interface UseNodeEditingContextOptions {
    editingNode: CanvasNode | null;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    currentGraph: NodalGraph;
    flow: Flow;
    graphContext: NodalGraphContext;
}

// Derives the selected node's editable context, preview data, and modal state.
export function useNodeEditingContext({
    editingNode,
    nodes,
    edges,
    currentGraph,
    flow,
    graphContext,
}: UseNodeEditingContextOptions) {
    const { currentWorkspace } = usePage<InertiaPageProps & PageProps>().props;
    const editingNodeCurrent = editingNode
        ? nodes.find(node => node.id === editingNode.id) ?? editingNode
        : null;

    const editingAutocompleteContext = useMemo(() => {
        const hasRealFlowContext = graphContext === 'flow' && flow.id !== 'workspace-default-flow';
        return editingNodeCurrent
            ? analyzeNodalAutocompleteContext(
                currentGraph,
                editingNodeCurrent.id,
                buildPreviewDefaultInputs(flow, hasRealFlowContext, {
                    keyboardSpeed: currentWorkspace?.keyboard_speed ?? 100,
                    viewportWidth: currentWorkspace?.viewport_width ?? 1280,
                    viewportHeight: currentWorkspace?.viewport_height ?? 720,
                }),
            )
            : null;
    }, [currentGraph, currentWorkspace, editingNodeCurrent, flow, graphContext]);

    const editingConnectedNodes = useMemo(() => {
        if (!editingNodeCurrent) return { inputs: [] as CanvasNode[], outputs: [] as CanvasNode[] };

        const nodeById = new Map(nodes.map(item => [item.id, item]));
        const inputs = edges
            .filter(edge => edge.targetNodeId === editingNodeCurrent.id)
            .map(edge => nodeById.get(edge.sourceNodeId))
            .filter((item): item is CanvasNode => Boolean(item))
            .filter(item => !item.system);
        const outputs = edges
            .filter(edge => edge.sourceNodeId === editingNodeCurrent.id)
            .map(edge => nodeById.get(edge.targetNodeId))
            .filter((item): item is CanvasNode => Boolean(item))
            .filter(item => !item.system);

        return { inputs, outputs };
    }, [edges, editingNodeCurrent, nodes]);

    const editingNodeIsFinally = useMemo(() => {
        if (!editingNodeCurrent || editingNodeCurrent.system) return false;

        const terminateNode = nodes.find(node => node.system === 'terminate');
        const terminateNodeId = terminateNode?.id;
        const terminateY = terminateNode?.y ?? SYSTEM_TERMINATE_POSITION.y;
        const finallyNodeIds = new Set<string>();
        const queue = terminateNodeId
            ? edges
                .filter(edge => edge.sourceNodeId === terminateNodeId)
                .map(edge => edge.targetNodeId)
            : [];

        while (queue.length > 0) {
            const nodeId = queue.shift();
            if (!nodeId || finallyNodeIds.has(nodeId)) continue;

            finallyNodeIds.add(nodeId);
            edges
                .filter(edge => edge.sourceNodeId === nodeId)
                .forEach(edge => queue.push(edge.targetNodeId));
        }

        return finallyNodeIds.has(editingNodeCurrent.id)
            || editingNodeCurrent.y >= terminateY;
    }, [edges, editingNodeCurrent, nodes]);

    const editingCurrentSiteUrl = useMemo(() => {
        if (!editingNodeCurrent) return null;

        const nodeById = new Map(nodes.map(item => [item.id, item]));
        const queue = [editingNodeCurrent.id];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const nodeId = queue.shift();
            if (!nodeId || visited.has(nodeId)) continue;
            visited.add(nodeId);

            const currentNode = nodeById.get(nodeId);
            const currentSiteUrl = getNodeSiteUrl(currentNode);
            if (currentSiteUrl) return currentSiteUrl;

            const incomingEdges = edges.filter(edge => edge.targetNodeId === nodeId);
            for (const edge of incomingEdges) {
                const sourceNode = nodeById.get(edge.sourceNodeId);
                const outputSiteUrl = getNodeSiteUrl(sourceNode, edge.sourcePort);
                if (outputSiteUrl) return outputSiteUrl;
                queue.push(edge.sourceNodeId);
            }
        }

        return null;
    }, [edges, editingNodeCurrent, nodes]);

    return {
        editingAutocompleteContext,
        editingConnectedNodes,
        editingCurrentSiteUrl,
        editingNodeIsFinally,
        editingNodeCurrent,
    };
}
