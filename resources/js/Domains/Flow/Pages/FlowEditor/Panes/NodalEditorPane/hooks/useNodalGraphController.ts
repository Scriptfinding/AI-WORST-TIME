import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useThemeMode } from '@/App/Hooks/useThemeMode';
import { useToast } from '@/App/Hooks/useToast';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import type { NodalEditorPaneProps } from '../NodalEditorPane.types';
import type { ContextMenuState } from '../components/ContextMenu/ContextMenu';
import type {
    CanvasEdge,
    CanvasNode,
    ConnectionDragState,
    KnifeDragState,
    NodeDragState,
    Point,
    PendingConnectionTarget,
    PendingEdgeInsertion,
    SelectionBox,
} from '../types';
import type { EdgeDropTarget } from '../utils/edges';
import { graphToCanvasNodes } from '../utils/graph';
import { useActiveNodalEditorPane } from './useActiveNodalEditorPane';
import { useCanvasViewport } from './useCanvasViewport';
import { useGraphHistory } from './useGraphHistory';
import { useGraphSynchronization } from './useGraphSynchronization';
import { useMiniMapVisibility } from './useMiniMapVisibility';
import { useNodeCatalog } from './useNodeCatalog';

type NodalGraphControllerProps = Pick<
    NodalEditorPaneProps,
    'graph' | 'graphContext' | 'functionArguments' | 'graphRevision' | 'onGraphChange' | 'readOnly'
>;

const FUNCTION_VIEWPORT_FIT = {
    maxZoom: 0.9,
    anchorX: 0.38,
    anchorY: 0.46,
};

// Owns normalized graph state, selection, viewport, history, and graph mutations.
export function useNodalGraphController({
    graph,
    graphContext = 'flow',
    functionArguments = [],
    graphRevision,
    onGraphChange,
    readOnly = false,
}: NodalGraphControllerProps) {
    const { resolved: resolvedTheme } = useThemeMode();
    const { toast } = useToast();
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const selectionPointerRef = useRef<number | null>(null);
    const nodeDragRef = useRef<NodeDragState | null>(null);
    const connectionDragRef = useRef<ConnectionDragState | null>(null);
    const knifeDragRef = useRef<KnifeDragState | null>(null);
    const lastPointerWorldRef = useRef<Point | null>(null);
    const pendingNodePlacementRef = useRef<Point | null>(null);
    const [nodes, setNodes] = useState<CanvasNode[]>(() => graphToCanvasNodes(graph));
    const {
        selectedItem: editingNode,
        openModal: openEditingNode,
        closeModal: closeEditingNode,
    } = useUrlSyncedModal(nodes, 'edit-node');
    const setEditingNode: Dispatch<SetStateAction<CanvasNode | null>> = useCallback(value => {
        const next = typeof value === 'function' ? value(editingNode) : value;
        if (next) {
            openEditingNode(next);
        } else {
            closeEditingNode();
        }
    }, [closeEditingNode, editingNode, openEditingNode]);
    const [edges, setEdges] = useState<CanvasEdge[]>(() => graph.edges);
    const [connectionDrag, setConnectionDrag] = useState<ConnectionDragState | null>(null);
    const [knifeDrag, setKnifeDrag] = useState<KnifeDragState | null>(null);
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(() => new Set());
    const [editingStickyNoteId, setEditingStickyNoteId] = useState<string | null>(null);
    const [pendingConnectionTarget, setPendingConnectionTarget] = useState<PendingConnectionTarget | null>(null);
    const [pendingEdgeInsertion, setPendingEdgeInsertion] = useState<PendingEdgeInsertion | null>(null);
    const [edgeDropTarget, setEdgeDropTarget] = useState<EdgeDropTarget | null>(null);
    const [openNodeMenuId, setOpenNodeMenuId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [canvasMode, setCanvasMode] = useState<'canvas' | 'code'>('canvas');
    const { activatePane, isActivePane, isAnotherPaneActive } = useActiveNodalEditorPane();
    const { miniMapFading, revealMiniMap, showMiniMap } = useMiniMapVisibility();
    const {
        centerViewportOnNodes,
        getWorldPointFromClient,
        setViewport,
        updateZoom,
        viewport,
    } = useCanvasViewport(canvasRef, nodes, graphContext === 'function' ? FUNCTION_VIEWPORT_FIT : undefined);
    const {
        activeCategoryKey,
        pickerOpen,
        search,
        setActiveCategoryKey,
        setPickerOpen,
        setSearch,
        visibleEntries,
    } = useNodeCatalog({ nodes, setNodes });
    const clearTransientGraphState = useCallback(() => {
        setSelectedNodeIds(new Set());
        closeEditingNode();
        setOpenNodeMenuId(null);
        setPendingConnectionTarget(null);
        setPendingEdgeInsertion(null);
        setEdgeDropTarget(null);
    }, [closeEditingNode]);
    const { recordHistory, resetHistory, undoGraph, redoGraph } = useGraphHistory({
        nodes,
        edges,
        readOnly,
        setNodes,
        setEdges,
        onApplySnapshot: clearTransientGraphState,
    });
    const { currentGraph, generatedCode } = useGraphSynchronization({
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
    });

    return {
        activeCategoryKey,
        activatePane,
        canvasMode,
        canvasRef,
        centerViewportOnNodes,
        connectionDrag,
        connectionDragRef,
        contextMenu,
        currentGraph,
        edgeDropTarget,
        editingNode,
        editingStickyNoteId,
        edges,
        generatedCode,
        getWorldPointFromClient,
        isActivePane,
        isAnotherPaneActive,
        knifeDrag,
        knifeDragRef,
        lastPointerWorldRef,
        miniMapFading,
        nodeDragRef,
        nodes,
        openNodeMenuId,
        pendingConnectionTarget,
        pendingEdgeInsertion,
        pendingNodePlacementRef,
        pickerOpen,
        readOnly,
        recordHistory,
        redoGraph,
        resolvedTheme,
        revealMiniMap,
        search,
        selectedNodeIds,
        selectionBox,
        selectionPointerRef,
        setActiveCategoryKey,
        setCanvasMode,
        setConnectionDrag,
        setContextMenu,
        setEdgeDropTarget,
        setEditingNode,
        setEditingStickyNoteId,
        setEdges,
        setKnifeDrag,
        setNodes,
        setOpenNodeMenuId,
        setPendingConnectionTarget,
        setPendingEdgeInsertion,
        setPickerOpen,
        setSearch,
        setSelectedNodeIds,
        setSelectionBox,
        setViewport,
        showMiniMap,
        toast,
        undoGraph,
        updateZoom,
        viewport,
        visibleEntries,
    };
}

export type NodalGraphController = ReturnType<typeof useNodalGraphController>;
