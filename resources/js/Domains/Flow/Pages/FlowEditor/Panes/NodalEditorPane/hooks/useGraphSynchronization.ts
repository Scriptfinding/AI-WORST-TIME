import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { compileNodalGraphToCode } from '@/Domains/Flow/Pages/FlowEditor/nodalCompiler';
import type { CanvasEdge, CanvasNode, NodalGraph, NodalGraphContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { canvasToNodalGraph, graphToCanvasNodes } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/graph';

interface UseGraphSynchronizationOptions {
    graph: NodalGraph;
    graphContext: NodalGraphContext;
    functionArguments: string[];
    graphRevision?: number;
    readOnly: boolean;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
    clearTransientGraphState: () => void;
    resetHistory: () => void;
    onGraphChange: (graph: NodalGraph) => void;
}

// Reconciles incoming graph revisions with local edits without losing active work.
export function useGraphSynchronization({
    graph,
    graphContext,
    functionArguments,
    graphRevision,
    readOnly,
    nodes,
    edges,
    setNodes,
    setEdges,
    clearTransientGraphState,
    resetHistory,
    onGraphChange,
}: UseGraphSynchronizationOptions) {
    const lastGraphRevisionRef = useRef(graphRevision);

    useEffect(() => {
        if (!readOnly) return;
        setNodes(graphToCanvasNodes(graph));
        setEdges(graph.edges);
        clearTransientGraphState();
    }, [clearTransientGraphState, graph, readOnly, setEdges, setNodes]);

    useEffect(() => {
        if (graphRevision === undefined || graphRevision === lastGraphRevisionRef.current) return;

        lastGraphRevisionRef.current = graphRevision;
        setNodes(graphToCanvasNodes(graph));
        setEdges(graph.edges);
        clearTransientGraphState();
        resetHistory();
    }, [
        clearTransientGraphState,
        graph,
        graphRevision,
        resetHistory,
        setEdges,
        setNodes,
    ]);

    const currentGraph = useMemo<NodalGraph>(
        () => canvasToNodalGraph(nodes, edges),
        [edges, nodes],
    );
    const lastPublishedGraphRef = useRef(JSON.stringify(currentGraph));
    const generatedCode = useMemo(() => {
        try {
            return compileNodalGraphToCode(currentGraph, { context: graphContext, functionArguments });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'The visual flow cannot be compiled.';
            return `// ${message}`;
        }
    }, [currentGraph, functionArguments, graphContext]);

    useEffect(() => {
        const serializedGraph = JSON.stringify(currentGraph);
        if (serializedGraph === lastPublishedGraphRef.current) return;

        lastPublishedGraphRef.current = serializedGraph;
        onGraphChange(currentGraph);
    }, [currentGraph, onGraphChange]);

    return {
        currentGraph,
        generatedCode,
    };
}
