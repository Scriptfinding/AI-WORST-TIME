import type React from 'react';
import type { ContextMenuState } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/ContextMenu';
import type {
    CanvasEdge,
    CanvasNode,
    PendingConnectionTarget,
    PendingEdgeInsertion,
    Point,
    TransformMode,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';

export interface UseNodalEditorEffectsOptions {
    allowShortcutsInModal?: boolean;
    canvasMode: 'canvas' | 'code';
    contextMenu: ContextMenuState | null;
    editingNodeCurrent: CanvasNode | null;
    edges: CanvasEdge[];
    getWorldPointFromClient: (clientX: number, clientY: number) => Point | null;
    isActivePane: () => boolean;
    isAnotherPaneActive: () => boolean;
    lastPointerWorldRef: React.MutableRefObject<Point | null>;
    pendingNodePlacementRef: React.MutableRefObject<Point | null>;
    nodes: CanvasNode[];
    openNodeMenuId: string | null;
    pasteNodesFromClipboard: (pastePoint: Point) => void;
    pendingConnectionTarget: PendingConnectionTarget | null;
    pendingEdgeInsertion: PendingEdgeInsertion | null;
    pickerOpen: boolean;
    readOnly: boolean;
    redoGraph: () => void;
    selectedNodeIds: Set<string>;
    startMoveTransform: () => void;
    startSwapTransform: () => void;
    transformMode: TransformMode | null;
    undoGraph: () => void;
    copySelectedNodes: () => void;
    duplicateSelectedNodes: () => void;
    toggleNodeDeactivation: (nodeIds: Iterable<string>) => void;
    deleteNodes: (nodeIds: Iterable<string>) => void;
    setEditingStickyNoteId: React.Dispatch<React.SetStateAction<string | null>>;
    setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState | null>>;
    setEditingNode: React.Dispatch<React.SetStateAction<CanvasNode | null>>;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setOpenNodeMenuId: React.Dispatch<React.SetStateAction<string | null>>;
    setPendingConnectionTarget: React.Dispatch<React.SetStateAction<PendingConnectionTarget | null>>;
    setPendingEdgeInsertion: React.Dispatch<React.SetStateAction<PendingEdgeInsertion | null>>;
    setPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    setTransformMode: React.Dispatch<React.SetStateAction<TransformMode | null>>;
}

export type NodalKeyboardShortcutsOptions = Omit<UseNodalEditorEffectsOptions,
    | 'getWorldPointFromClient'
    | 'setNodes'
>;
