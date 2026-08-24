import type React from 'react';
import type { ContextMenuState } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/ContextMenu';
import type { EdgeDropTarget } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/edges';
import type {
    CanvasEdge,
    CanvasNode,
    ConnectionDragState,
    KnifeDragState,
    NodeDragState,
    PendingConnectionTarget,
    PendingEdgeInsertion,
    Point,
    SelectionBox,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';

export interface CanvasViewport {
    x: number;
    y: number;
    zoom: number;
}

export interface UseCanvasInteractionsOptions {
    activatePane: () => void;
    canvasMode: 'canvas' | 'code';
    canvasRef: React.RefObject<HTMLDivElement | null>;
    connectionDragRef: React.MutableRefObject<ConnectionDragState | null>;
    edges: CanvasEdge[];
    getWorldPointFromClient: (clientX: number, clientY: number) => Point | null;
    knifeDragRef: React.MutableRefObject<KnifeDragState | null>;
    lastPointerWorldRef: React.MutableRefObject<Point | null>;
    nodeDragRef: React.MutableRefObject<NodeDragState | null>;
    nodes: CanvasNode[];
    onViewportPan?: () => void;
    readOnly: boolean;
    recordHistory: () => void;
    selectedNodeIds: Set<string>;
    selectionPointerRef: React.MutableRefObject<number | null>;
    setConnectionDrag: React.Dispatch<React.SetStateAction<ConnectionDragState | null>>;
    setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState | null>>;
    setEdgeDropTarget: React.Dispatch<React.SetStateAction<EdgeDropTarget | null>>;
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
    setKnifeDrag: React.Dispatch<React.SetStateAction<KnifeDragState | null>>;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setPendingConnectionTarget: React.Dispatch<React.SetStateAction<PendingConnectionTarget | null>>;
    setPendingEdgeInsertion: React.Dispatch<React.SetStateAction<PendingEdgeInsertion | null>>;
    setPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    setSelectionBox: React.Dispatch<React.SetStateAction<SelectionBox | null>>;
    setViewport: React.Dispatch<React.SetStateAction<CanvasViewport>>;
    viewport: CanvasViewport;
}
