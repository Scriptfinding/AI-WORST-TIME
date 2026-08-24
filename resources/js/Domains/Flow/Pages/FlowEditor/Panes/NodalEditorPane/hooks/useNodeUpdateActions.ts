import type React from 'react';
import { useCallback } from 'react';
import type {
    CanvasNode,
    NodeParameterValue,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';

interface UseNodeUpdateActionsOptions {
    readOnly: boolean;
    recordBurstHistory: (targetKey: string) => void;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
}

// Applies node position, size, label, and parameter updates to the graph.
export function useNodeUpdateActions({
    readOnly,
    recordBurstHistory,
    setNodes,
}: UseNodeUpdateActionsOptions) {
    const updateNodeValue = useCallback((
        nodeId: string,
        key: string,
        value: NodeParameterValue,
    ) => {
        if (readOnly) return;
        recordBurstHistory(`value:${nodeId}:${key}`);
        setNodes(current => current.map(node => node.id === nodeId
            ? { ...node, values: { ...node.values, [key]: value } }
            : node));
    }, [readOnly, recordBurstHistory, setNodes]);

    return { updateNodeValue };
}
