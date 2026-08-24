import { useEffect } from 'react';
import { createNodalKeyDownHandler } from './nodalKeyboardShortcuts';
import type { NodalKeyboardShortcutsOptions } from './useNodalEditorEffects.types';

// Maps editor keyboard shortcuts to selection, clipboard, history, and run actions.
export function useNodalKeyboardShortcuts(options: NodalKeyboardShortcutsOptions) {
    const {
        allowShortcutsInModal, canvasMode, contextMenu, copySelectedNodes, deleteNodes,
        duplicateSelectedNodes, editingNodeCurrent, edges, isActivePane, isAnotherPaneActive, lastPointerWorldRef,
        nodes, openNodeMenuId, pasteNodesFromClipboard, pendingConnectionTarget, pendingEdgeInsertion,
        pendingNodePlacementRef, pickerOpen, readOnly, redoGraph, selectedNodeIds, setContextMenu, setEditingNode,
        setEditingStickyNoteId, setOpenNodeMenuId, setPendingConnectionTarget, setPendingEdgeInsertion,
        setPickerOpen, setSearch, setSelectedNodeIds, setTransformMode, startMoveTransform,
        startSwapTransform, toggleNodeDeactivation, transformMode, undoGraph,
    } = options;

    useEffect(() => {
        const handleKeyDown = createNodalKeyDownHandler({
            allowShortcutsInModal,
            canvasMode,
            contextMenu,
            copySelectedNodes,
            deleteNodes,
            duplicateSelectedNodes,
            editingNodeCurrent,
            edges,
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
            toggleNodeDeactivation,
            transformMode,
            undoGraph,
        });

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [allowShortcutsInModal, canvasMode, contextMenu, copySelectedNodes, deleteNodes, duplicateSelectedNodes, editingNodeCurrent, edges, isActivePane, isAnotherPaneActive, lastPointerWorldRef, nodes, openNodeMenuId, pasteNodesFromClipboard, pendingConnectionTarget, pendingEdgeInsertion, pendingNodePlacementRef, pickerOpen, readOnly, redoGraph, selectedNodeIds, setContextMenu, setEditingNode, setEditingStickyNoteId, setOpenNodeMenuId, setPendingConnectionTarget, setPendingEdgeInsertion, setPickerOpen, setSearch, setSelectedNodeIds, setTransformMode, startMoveTransform, startSwapTransform, toggleNodeDeactivation, transformMode, undoGraph]);
}
