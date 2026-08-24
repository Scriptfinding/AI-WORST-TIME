import type React from 'react';
import { useCallback, useRef } from 'react';
import type { CanvasEdge, CanvasNode, GraphHistory, GraphSnapshot } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { cloneSnapshot } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/graph';

interface UseGraphHistoryOptions {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    readOnly: boolean;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
    onApplySnapshot?: () => void;
}

// Records graph snapshots and exposes bounded undo and redo navigation.
export function useGraphHistory({
    nodes,
    edges,
    readOnly,
    setNodes,
    setEdges,
    onApplySnapshot,
}: UseGraphHistoryOptions) {
    const historyRef = useRef<GraphHistory>({ past: [], future: [] });

    const getSnapshot = useCallback(() => cloneSnapshot({ nodes, edges }), [edges, nodes]);

    const applySnapshot = useCallback((snapshot: GraphSnapshot) => {
        const nextSnapshot = cloneSnapshot(snapshot);

        setNodes(nextSnapshot.nodes);
        setEdges(nextSnapshot.edges);
        onApplySnapshot?.();
    }, [onApplySnapshot, setEdges, setNodes]);

    const recordHistory = useCallback(() => {
        if (readOnly) return;

        const snapshot = getSnapshot();
        historyRef.current = {
            past: [...historyRef.current.past, snapshot].slice(-80),
            future: [],
        };
    }, [getSnapshot, readOnly]);

    const resetHistory = useCallback(() => {
        historyRef.current = { past: [], future: [] };
    }, []);

    const undoGraph = useCallback(() => {
        const previous = historyRef.current.past.at(-1);
        if (!previous) return;

        historyRef.current = {
            past: historyRef.current.past.slice(0, -1),
            future: [getSnapshot(), ...historyRef.current.future].slice(0, 80),
        };
        applySnapshot(previous);
    }, [applySnapshot, getSnapshot]);

    const redoGraph = useCallback(() => {
        const next = historyRef.current.future[0];
        if (!next) return;

        historyRef.current = {
            past: [...historyRef.current.past, getSnapshot()].slice(-80),
            future: historyRef.current.future.slice(1),
        };
        applySnapshot(next);
    }, [applySnapshot, getSnapshot]);

    return {
        recordHistory,
        resetHistory,
        undoGraph,
        redoGraph,
    };
}
