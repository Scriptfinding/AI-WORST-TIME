import type React from 'react';
import type {
    CanvasEdge,
    CanvasNode,
    PendingConnectionTarget,
    PendingEdgeInsertion,
    Point,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { useAddNodeAction } from './useAddNodeAction';
import { useBurstHistory } from './useBurstHistory';
import { useNodeClipboardActions } from './useNodeClipboardActions';
import { useNodeCrudActions } from './useNodeCrudActions';
import { useNodeDeactivationActions } from './useNodeDeactivationActions';
import { useNodeDuplicationActions } from './useNodeDuplicationActions';
import { useNodeSelectionActions } from './useNodeSelectionActions';
import { useNodeUpdateActions } from './useNodeUpdateActions';
import { useStickyNoteActions } from './useStickyNoteActions';

interface UseNodeActionsOptions {
    canvasRef: React.RefObject<HTMLDivElement | null>;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    selectedNodeIds: Set<string>;
    pendingConnectionTarget: PendingConnectionTarget | null;
    pendingEdgeInsertion: PendingEdgeInsertion | null;
    pendingNodePlacementRef: React.MutableRefObject<Point | null>;
    viewport: { x: number; y: number; zoom: number };
    readOnly: boolean;
    recordHistory: () => void;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    setEditingNode: React.Dispatch<React.SetStateAction<CanvasNode | null>>;
    setOpenNodeMenuId: React.Dispatch<React.SetStateAction<string | null>>;
    setPendingConnectionTarget: React.Dispatch<React.SetStateAction<PendingConnectionTarget | null>>;
    setPendingEdgeInsertion: React.Dispatch<React.SetStateAction<PendingEdgeInsertion | null>>;
    setPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    toast: (message: string, type?: 'error') => void;
}

// Composes node CRUD, selection, clipboard, duplication, and sticky-note actions.
export function useNodeActions(options: UseNodeActionsOptions) {
    const recordBurstHistory = useBurstHistory(options.recordHistory);
    const addNode = useAddNodeAction(options);
    const { deleteNodes, renameNode } = useNodeCrudActions(options);
    const {
        addStickyNote,
        updateStickyNote,
        updateStickyNoteColor,
    } = useStickyNoteActions({ ...options, recordBurstHistory });
    const { updateNodeValue } = useNodeUpdateActions({
        ...options,
        recordBurstHistory,
    });
    const {
        duplicateNode,
        duplicateSelectedNodes,
    } = useNodeDuplicationActions(options);
    const {
        canPasteNodes,
        copySelectedNodes,
        pasteNodesFromClipboard,
    } = useNodeClipboardActions(options);
    const { swapSelectedNodes } = useNodeSelectionActions(options);
    const {
        toggleNodeDeactivation,
        toggleNodeOrSelectionDeactivation,
    } = useNodeDeactivationActions(options);

    return {
        addNode,
        addStickyNote,
        canPasteNodes,
        copySelectedNodes,
        deleteNodes,
        duplicateNode,
        duplicateSelectedNodes,
        pasteNodesFromClipboard,
        renameNode,
        swapSelectedNodes,
        toggleNodeDeactivation,
        toggleNodeOrSelectionDeactivation,
        updateStickyNote,
        updateStickyNoteColor,
        updateNodeValue,
    };
}
