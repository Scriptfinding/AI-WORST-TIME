import { useMemo } from 'react';
import { isSingleHandleNode } from '../utils/node';
import { useCanvasViewActions } from './useCanvasViewActions';
import type { NodalGraphController } from './useNodalGraphController';
import type { NodalInteractionsController } from './useNodalInteractionsController';

interface NodalCanvasControllerProps {
    graphController: NodalGraphController;
    interactionsController: NodalInteractionsController;
}

// Shapes graph and interaction state into the props required by the nodal canvas.
export function useNodalCanvasController({
    graphController,
    interactionsController,
}: NodalCanvasControllerProps) {
    const {
        canvasMode,
        canvasRef,
        centerViewportOnNodes,
        contextMenu,
        editingNode,
        edges,
        lastPointerWorldRef,
        nodes,
        pendingNodePlacementRef,
        readOnly,
        recordHistory,
        selectedNodeIds,
        setActiveCategoryKey,
        setCanvasMode,
        setContextMenu,
        setEditingNode,
        setEditingStickyNoteId,
        setEdges,
        setNodes,
        setOpenNodeMenuId,
        setPendingConnectionTarget,
        setPendingEdgeInsertion,
        setPickerOpen,
        setSearch,
        setSelectedNodeIds,
        setViewport,
        updateZoom,
        viewport,
    } = graphController;
    const canvasViewActions = useCanvasViewActions({
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
        addStickyNote: interactionsController.addStickyNote,
        deleteNodes: interactionsController.deleteNodes,
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
    });
    const contextNode = contextMenu?.nodeId
        ? nodes.find(node => node.id === contextMenu.nodeId) ?? null
        : null;
    const selectedEditableNodes = useMemo(
        () => nodes.filter(node => selectedNodeIds.has(node.id) && !node.system),
        [nodes, selectedNodeIds],
    );
    const canCopySelection = selectedEditableNodes.length > 0;
    const canSwapSelection = selectedEditableNodes.length === 2
        && selectedEditableNodes.every(isSingleHandleNode);

    return {
        canvasViewActions,
        canCopySelection,
        canSwapSelection,
        contextNode,
        selectedEditableNodes,
    };
}
