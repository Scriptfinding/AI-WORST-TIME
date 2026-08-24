import { useNodalKeyboardShortcuts } from './useNodalKeyboardShortcuts';
import { useNodalOverlayDismissal } from './useNodalOverlayDismissal';
import { useNodeEditingDismissal } from './useNodeEditingDismissal';
import { useNodeTransformSession } from './useNodeTransformSession';
import type { UseNodalEditorEffectsOptions } from './useNodalEditorEffects.types';

// Synchronizes external graph revisions and runtime progress with the nodal editor.
export function useNodalEditorEffects({
    allowShortcutsInModal = false,
    canvasMode,
    contextMenu,
    editingNodeCurrent,
    edges,
    getWorldPointFromClient,
    isActivePane,
    isAnotherPaneActive,
    lastPointerWorldRef,
    nodes,
    openNodeMenuId,
    pasteNodesFromClipboard,
    pendingConnectionTarget,
    pendingEdgeInsertion,
    pendingNodePlacementRef,
    pickerOpen,
    readOnly,
    redoGraph,
    selectedNodeIds,
    startMoveTransform,
    startSwapTransform,
    transformMode,
    undoGraph,
    copySelectedNodes,
    duplicateSelectedNodes,
    toggleNodeDeactivation,
    deleteNodes,
    setEditingStickyNoteId,
    setContextMenu,
    setEditingNode,
    setNodes,
    setOpenNodeMenuId,
    setPendingConnectionTarget,
    setPendingEdgeInsertion,
    setPickerOpen,
    setSearch,
    setSelectedNodeIds,
    setTransformMode,
}: UseNodalEditorEffectsOptions) {
    useNodeEditingDismissal({
        editingNodeCurrent,
        setEditingNode,
    });

    useNodeTransformSession({
        getWorldPointFromClient,
        lastPointerWorldRef,
        setNodes,
        setTransformMode,
        transformMode,
    });

    useNodalKeyboardShortcuts({
        allowShortcutsInModal,
        canvasMode,
        contextMenu,
        copySelectedNodes,
        deleteNodes,
        duplicateSelectedNodes,
        toggleNodeDeactivation,
        editingNodeCurrent,
        edges,
        isActivePane,
        isAnotherPaneActive,
        lastPointerWorldRef,
        pendingNodePlacementRef,
        nodes,
        openNodeMenuId,
        pasteNodesFromClipboard,
        pendingConnectionTarget,
        pendingEdgeInsertion,
        pickerOpen,
        readOnly,
        redoGraph,
        selectedNodeIds,
        setContextMenu,
        setEditingNode,
        setEditingStickyNoteId,
        setOpenNodeMenuId,
        setPendingConnectionTarget,
        setPendingEdgeInsertion,
        setPickerOpen,
        setSearch,
        setSelectedNodeIds,
        setTransformMode,
        startMoveTransform,
        startSwapTransform,
        transformMode,
        undoGraph,
    });

    useNodalOverlayDismissal({
        openNodeMenuId,
        pendingNodePlacementRef,
        pickerOpen,
        setOpenNodeMenuId,
        setPendingConnectionTarget,
        setPendingEdgeInsertion,
        setPickerOpen,
    });
}
