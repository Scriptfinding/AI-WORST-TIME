import type { NodalKeyboardShortcutsOptions } from './useNodalEditorEffects.types';
import { hasOpenModal, isEditableShortcutTarget } from './nodalKeyboardShortcuts.utils';
import { canDeactivateNode } from '../utils/node';

export function createNodalKeyDownHandler(options: NodalKeyboardShortcutsOptions) {
    const {
        allowShortcutsInModal, canvasMode, contextMenu, copySelectedNodes, deleteNodes,
        duplicateSelectedNodes, editingNodeCurrent, edges, isActivePane, isAnotherPaneActive, lastPointerWorldRef,
        nodes, openNodeMenuId, pasteNodesFromClipboard, pendingConnectionTarget, pendingEdgeInsertion,
        pendingNodePlacementRef, pickerOpen, readOnly, redoGraph, selectedNodeIds, setContextMenu, setEditingNode,
        setEditingStickyNoteId, setOpenNodeMenuId, setPendingConnectionTarget, setPendingEdgeInsertion,
        setPickerOpen, setSearch, setSelectedNodeIds, setTransformMode, startMoveTransform,
        startSwapTransform, toggleNodeDeactivation, transformMode, undoGraph,
    } = options;

    return (event: KeyboardEvent) => {
        const isEscape = event.key === 'Escape';
        const isCopyShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c';

        if (isAnotherPaneActive()) return;

        if (isEscape) {
            if (editingNodeCurrent || hasOpenModal()) return;

            if (transformMode || pickerOpen || pendingConnectionTarget || pendingEdgeInsertion || openNodeMenuId || contextMenu) {
                event.preventDefault();
                event.stopImmediatePropagation();
                setPickerOpen(false);
                setPendingConnectionTarget(null);
                setPendingEdgeInsertion(null);
                pendingNodePlacementRef.current = null;
                setOpenNodeMenuId(null);
                setContextMenu(null);
                setTransformMode(null);
                return;
            }

            if (isEditableShortcutTarget(event)) return;

            if (canvasMode === 'canvas' && isActivePane() && selectedNodeIds.size > 0) {
                event.preventDefault();
                event.stopImmediatePropagation();
                setSelectedNodeIds(new Set());
            }
            return;
        }

        if (isEditableShortcutTarget(event)) return;
        if (editingNodeCurrent || (hasOpenModal() && !allowShortcutsInModal)) return;

        if (isCopyShortcut && isActivePane() && selectedNodeIds.size > 0) {
            event.preventDefault();
            event.stopImmediatePropagation();
            copySelectedNodes();
            return;
        }

        if (transformMode) return;

        const isPasteShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v';
        if (isPasteShortcut && !readOnly && canvasMode === 'canvas') {
            event.preventDefault();
            event.stopImmediatePropagation();
            pasteNodesFromClipboard(lastPointerWorldRef.current ?? { x: 0, y: 0 });
            return;
        }

        const isUndoShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !event.shiftKey;
        const isRedoShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && event.shiftKey;

        if (isUndoShortcut && !readOnly) {
            event.preventDefault();
            event.stopImmediatePropagation();
            undoGraph();
            return;
        }

        if (isRedoShortcut && !readOnly) {
            event.preventDefault();
            event.stopImmediatePropagation();
            redoGraph();
            return;
        }

        const isPlainShortcut = !event.metaKey && !event.ctrlKey && !event.altKey;
        const key = event.key.toLowerCase();
        const isSelectAllShortcut = key === 'a' && (event.metaKey || event.ctrlKey) && !event.altKey && canvasMode === 'canvas';

        if (isPlainShortcut && (key === 'arrowleft' || key === 'arrowright') && canvasMode === 'canvas') {
            if (selectedNodeIds.size !== 1) return;

            const [selectedNodeId] = selectedNodeIds;
            const connectedNodeId = edges
                .map(edge => key === 'arrowright'
                    ? (edge.sourceNodeId === selectedNodeId ? edge.targetNodeId : null)
                    : (edge.targetNodeId === selectedNodeId ? edge.sourceNodeId : null))
                .find((nodeId): nodeId is string => Boolean(nodeId) && nodes.some(node => node.id === nodeId));

            if (!connectedNodeId) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            setPickerOpen(false);
            setPendingConnectionTarget(null);
            setPendingEdgeInsertion(null);
            setOpenNodeMenuId(null);
            setContextMenu(null);
            setSelectedNodeIds(new Set([connectedNodeId]));
            return;
        }

        if (isPlainShortcut && (key === 'enter' || key === 'e') && canvasMode === 'canvas') {
            const selectedEditableNodes = nodes.filter(node => selectedNodeIds.has(node.id) && !node.system);
            if (selectedEditableNodes.length !== 1) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            setPickerOpen(false);
            setPendingConnectionTarget(null);
            setPendingEdgeInsertion(null);
            setOpenNodeMenuId(null);
            setContextMenu(null);
            if (selectedEditableNodes[0].kind === 'stickyNote') {
                setEditingNode(null);
                setEditingStickyNoteId(selectedEditableNodes[0].id);
                return;
            }

            setEditingStickyNoteId(null);
            setEditingNode(selectedEditableNodes[0]);
            return;
        }

        if (isSelectAllShortcut) {
            event.preventDefault();
            event.stopImmediatePropagation();
            setSelectedNodeIds(new Set(nodes.map(node => node.id)));
            return;
        }

        if (isPlainShortcut && (key === 'a' || key === 'n') && !readOnly && canvasMode === 'canvas') {
            event.preventDefault();
            event.stopImmediatePropagation();
            setPendingConnectionTarget(null);
            setPendingEdgeInsertion(null);
            pendingNodePlacementRef.current = key === 'a' ? lastPointerWorldRef.current : null;
            setSearch('');
            setPickerOpen(true);
            return;
        }

        if (isPlainShortcut && key === 'g' && !readOnly && canvasMode === 'canvas') {
            event.preventDefault();
            event.stopImmediatePropagation();
            startMoveTransform();
            return;
        }

        if (isPlainShortcut && key === 's' && !readOnly && canvasMode === 'canvas') {
            event.preventDefault();
            event.stopImmediatePropagation();
            startSwapTransform();
            return;
        }

        if (isPlainShortcut && key === 'm' && !readOnly && canvasMode === 'canvas') {
            const hasMutableSelection = nodes.some(node => selectedNodeIds.has(node.id) && canDeactivateNode(node));
            if (!hasMutableSelection) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            toggleNodeDeactivation(selectedNodeIds);
            return;
        }

        if (isPlainShortcut && key === 'd' && !readOnly && canvasMode === 'canvas') {
            const selectedEditableNodes = nodes.filter(node => selectedNodeIds.has(node.id) && !node.system);
            if (selectedEditableNodes.length === 0) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            duplicateSelectedNodes();
            return;
        }

        const isDeleteShortcut = event.key === 'Delete'
            || event.key === 'Backspace'
            || (isPlainShortcut && key === 'x' && canvasMode === 'canvas');

        if (!isDeleteShortcut) return;
        if (readOnly) return;
        if (selectedNodeIds.size === 0) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        deleteNodes(selectedNodeIds);
    };
}
