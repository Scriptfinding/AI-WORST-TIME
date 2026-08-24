import type React from 'react';
import { useCallback, useEffect } from 'react';
import type { ContextMenuState } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/ContextMenu';
import type {
    CanvasEdge,
    CanvasNode,
    PendingConnectionTarget,
    PendingEdgeInsertion,
    Point,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { arrangeGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/layout';
import { hasOpenModal } from './nodalKeyboardShortcuts.utils';

const STICKY_NOTE_BUTTON_RANDOM_OFFSET = 96;

interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

interface UseCanvasViewActionsOptions {
    canvasRef: React.RefObject<HTMLDivElement | null>;
    canvasMode: 'canvas' | 'code';
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    selectedNodeIds: Set<string>;
    editingNode: CanvasNode | null;
    viewport: Viewport;
    readOnly: boolean;
    lastPointerWorldRef: React.MutableRefObject<Point | null>;
    pendingNodePlacementRef: React.MutableRefObject<Point | null>;
    recordHistory: () => void;
    addStickyNote: (position: Point) => void;
    deleteNodes: (nodeIds: Iterable<string>) => void;
    centerViewportOnNodes: (items?: CanvasNode[]) => boolean;
    updateZoom: (delta: number) => void;
    setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    setEditingNode: React.Dispatch<React.SetStateAction<CanvasNode | null>>;
    setEditingStickyNoteId: React.Dispatch<React.SetStateAction<string | null>>;
    setOpenNodeMenuId: React.Dispatch<React.SetStateAction<string | null>>;
    setPendingConnectionTarget: React.Dispatch<React.SetStateAction<PendingConnectionTarget | null>>;
    setPendingEdgeInsertion: React.Dispatch<React.SetStateAction<PendingEdgeInsertion | null>>;
    setPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    setCanvasMode: React.Dispatch<React.SetStateAction<'canvas' | 'code'>>;
    setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState | null>>;
    setActiveCategoryKey: React.Dispatch<React.SetStateAction<string>>;
}

// Provides zoom, fit, center, and minimap controls for the nodal canvas.
export function useCanvasViewActions({
    canvasRef,
    canvasMode,
    nodes,
    edges,
    selectedNodeIds,
    editingNode,
    viewport,
    readOnly,
    lastPointerWorldRef,
    pendingNodePlacementRef,
    recordHistory,
    addStickyNote,
    deleteNodes,
    centerViewportOnNodes,
    updateZoom,
    setViewport,
    setNodes,
    setEdges,
    setSelectedNodeIds,
    setEditingNode,
    setEditingStickyNoteId,
    setOpenNodeMenuId,
    setPendingConnectionTarget,
    setPendingEdgeInsertion,
    setPickerOpen,
    setSearch,
    setCanvasMode,
    setContextMenu,
    setActiveCategoryKey,
}: UseCanvasViewActionsOptions) {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let canvasGestureActive = false;
        const startedInsideCanvas = (event: Event) => event.composedPath().includes(canvas);

        const preventPageZoom = (event: WheelEvent) => {
            const target = event.target instanceof HTMLElement ? event.target : null;
            const modalOverlay = target?.closest('[data-modal-overlay]');
            if (target?.closest('input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"], [role="textbox"]')) return;
            if (target?.closest('[data-node-picker]') || (modalOverlay && canvas.contains(modalOverlay))) return;
            event.preventDefault();
        };
        const preventCapturedPinch = (event: WheelEvent) => {
            if ((!event.ctrlKey && !event.metaKey) || !startedInsideCanvas(event)) return;
            event.preventDefault();
        };
        const handleGestureStart = (event: Event) => {
            canvasGestureActive = startedInsideCanvas(event);
            if (canvasGestureActive) event.preventDefault();
        };
        const handleGestureChange = (event: Event) => {
            if (canvasGestureActive || startedInsideCanvas(event)) event.preventDefault();
        };
        const handleGestureEnd = (event: Event) => {
            if (canvasGestureActive || startedInsideCanvas(event)) event.preventDefault();
            canvasGestureActive = false;
        };

        canvas.addEventListener('wheel', preventPageZoom, { passive: false });
        window.addEventListener('wheel', preventCapturedPinch, { passive: false, capture: true });
        window.addEventListener('gesturestart', handleGestureStart, { passive: false, capture: true });
        window.addEventListener('gesturechange', handleGestureChange, { passive: false, capture: true });
        window.addEventListener('gestureend', handleGestureEnd, { passive: false, capture: true });
        return () => {
            canvas.removeEventListener('wheel', preventPageZoom);
            window.removeEventListener('wheel', preventCapturedPinch, true);
            window.removeEventListener('gesturestart', handleGestureStart, true);
            window.removeEventListener('gesturechange', handleGestureChange, true);
            window.removeEventListener('gestureend', handleGestureEnd, true);
        };
    }, [canvasRef, setViewport]);

    const reorderGraph = useCallback(() => {
        if (readOnly) return;
        recordHistory();

        const rect = canvasRef.current?.getBoundingClientRect();
        const arranged = arrangeGraph(nodes, edges);

        setNodes(arranged.nodes);

        if (!rect || arranged.nodes.length === 0) return;

        setViewport(current => ({
            ...current,
            x: rect.width / 2 - arranged.graphCenter.x * current.zoom,
            y: rect.height / 2 - arranged.graphCenter.y * current.zoom,
        }));
    }, [canvasRef, edges, nodes, readOnly, recordHistory, setNodes, setViewport]);

    useEffect(() => {
        if (readOnly || canvasMode !== 'canvas') return;

        const handleTidyShortcut = (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey || event.altKey || event.key.toLowerCase() !== 't') return;
            if (editingNode || hasOpenModal()) return;
            const target = event.target instanceof Element ? event.target : null;
            if (target?.closest('input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"], [role="textbox"], .monaco-editor, .cm-editor')) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            reorderGraph();
        };

        window.addEventListener('keydown', handleTidyShortcut);
        return () => window.removeEventListener('keydown', handleTidyShortcut);
    }, [canvasMode, editingNode, readOnly, reorderGraph]);

    const handleAddStickyNote = useCallback(() => {
        const rect = canvasRef.current?.getBoundingClientRect();
        const randomOffset = () => (Math.random() - 0.5) * STICKY_NOTE_BUTTON_RANDOM_OFFSET * 2;
        const basePosition = rect
            ? {
                x: (rect.width / 2 - viewport.x) / viewport.zoom,
                y: (rect.height / 2 - viewport.y) / viewport.zoom,
            }
            : (lastPointerWorldRef.current ?? { x: 0, y: 0 });
        const position = {
            x: basePosition.x + randomOffset(),
            y: basePosition.y + randomOffset(),
        };

        setPendingConnectionTarget(null);
        setPendingEdgeInsertion(null);
        pendingNodePlacementRef.current = null;
        setPickerOpen(false);
        setSearch('');
        addStickyNote(position);
    }, [
        addStickyNote,
        canvasRef,
        lastPointerWorldRef,
        pendingNodePlacementRef,
        setPendingConnectionTarget,
        setPendingEdgeInsertion,
        setPickerOpen,
        setSearch,
        viewport,
    ]);

    return {
        closeContextMenu: () => setContextMenu(null),
        closeNodeConfig: () => setEditingNode(null),
        closeNodePicker: () => {
            setPickerOpen(false);
            setPendingConnectionTarget(null);
            setPendingEdgeInsertion(null);
            pendingNodePlacementRef.current = null;
        },
        deleteNode: (node: CanvasNode) => deleteNodes([node.id]),
        deleteSelection: () => deleteNodes(selectedNodeIds),
        editNode: (node: CanvasNode) => setEditingNode(node),
        editStickyNote: (node: CanvasNode) => setEditingStickyNoteId(node.id),
        handleAddStickyNote,
        insertNodeOnEdge: (insertion: PendingEdgeInsertion) => {
            setPendingConnectionTarget(null);
            setPendingEdgeInsertion(insertion);
            pendingNodePlacementRef.current = null;
            setSearch('');
            setPickerOpen(false);
            window.requestAnimationFrame(() => setPickerOpen(true));
        },
        openNodePicker: (position?: Point) => {
            setPendingConnectionTarget(null);
            setPendingEdgeInsertion(null);
            pendingNodePlacementRef.current = position ?? null;
            setSearch('');
            setPickerOpen(true);
        },
        removeEdge: (edgeId: string) => {
            recordHistory();
            setEdges(current => current.filter(item => item.id !== edgeId));
        },
        reorderGraph,
        selectAllNodes: () => setSelectedNodeIds(new Set(nodes.map(node => node.id))),
        selectNodeCategory: (categoryKey: string) => {
            setActiveCategoryKey(categoryKey);
            setSearch('');
        },
        startEditingNode: (node: CanvasNode) => {
            if (
                (!node.system || (node.system === 'function' && node.scopeId))
                && node.kind !== 'stickyNote'
            ) {
                setEditingNode(node);
            }
        },
        stopEditingStickyNote: () => setEditingStickyNoteId(null),
        toggleCanvasMode: () => setCanvasMode(current => current === 'canvas' ? 'code' : 'canvas'),
        toggleNodeMenu: (nodeId: string) => {
            setOpenNodeMenuId(current => current === nodeId ? null : nodeId);
        },
        toggleNodePicker: () => {
            setPendingConnectionTarget(null);
            setPendingEdgeInsertion(null);
            pendingNodePlacementRef.current = null;
            setPickerOpen(open => !open);
        },
        viewportCenter: () => centerViewportOnNodes(),
        zoomIn: () => updateZoom(0.195),
        zoomOut: () => updateZoom(-0.195),
    };
}
