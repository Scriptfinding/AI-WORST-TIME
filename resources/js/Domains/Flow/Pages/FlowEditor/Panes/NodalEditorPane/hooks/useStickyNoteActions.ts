import type React from 'react';
import { useCallback } from 'react';
import {
    STICKY_NOTE_ENTRY,
    STICKY_NOTE_NODE_NAME,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import { snapCanvasPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/grid';
import type {
    CanvasNode,
    PendingConnectionTarget,
    PendingEdgeInsertion,
    StickyNoteColor,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import {
    DEFAULT_STICKY_NOTE,
    type StickyNoteUpdate,
} from './nodeActions.utils';

interface UseStickyNoteActionsOptions {
    nodes: CanvasNode[];
    readOnly: boolean;
    recordHistory: () => void;
    recordBurstHistory: (targetKey: string) => void;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    setOpenNodeMenuId: React.Dispatch<React.SetStateAction<string | null>>;
    setPendingConnectionTarget: React.Dispatch<React.SetStateAction<PendingConnectionTarget | null>>;
    setPendingEdgeInsertion: React.Dispatch<React.SetStateAction<PendingEdgeInsertion | null>>;
    setPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
}

// Creates and edits canvas sticky notes as undoable graph changes.
export function useStickyNoteActions({
    nodes,
    readOnly,
    recordHistory,
    recordBurstHistory,
    setNodes,
    setSelectedNodeIds,
    setOpenNodeMenuId,
    setPendingConnectionTarget,
    setPendingEdgeInsertion,
    setPickerOpen,
    setSearch,
}: UseStickyNoteActionsOptions) {
    const addStickyNote = useCallback((position: { x: number; y: number }) => {
        if (readOnly) return;

        recordHistory();
        const nextNode: CanvasNode = {
            id: `${STICKY_NOTE_NODE_NAME}-${Date.now()}-${nodes.length}`,
            entry: STICKY_NOTE_ENTRY,
            kind: 'stickyNote',
            label: 'Sticky note',
            x: snapCanvasPosition(position.x),
            y: snapCanvasPosition(position.y),
            values: {},
            stickyNote: DEFAULT_STICKY_NOTE,
        };

        setNodes(current => [...current, nextNode]);
        setSelectedNodeIds(new Set([nextNode.id]));
        setOpenNodeMenuId(null);
        setPickerOpen(false);
        setPendingConnectionTarget(null);
        setPendingEdgeInsertion(null);
        setSearch('');
    }, [
        nodes.length,
        readOnly,
        recordHistory,
        setNodes,
        setOpenNodeMenuId,
        setPendingConnectionTarget,
        setPendingEdgeInsertion,
        setPickerOpen,
        setSearch,
        setSelectedNodeIds,
    ]);

    const updateStickyNote = useCallback((nodeId: string, changes: StickyNoteUpdate) => {
        if (readOnly) return;

        const { x, y, ...stickyNoteChanges } = changes;
        recordBurstHistory(`stickyNote:${nodeId}`);
        setNodes(current => current.map(node => {
            if (node.id !== nodeId || node.kind !== 'stickyNote') return node;

            return {
                ...node,
                x: x ?? node.x,
                y: y ?? node.y,
                stickyNote: {
                    ...(node.stickyNote ?? DEFAULT_STICKY_NOTE),
                    ...stickyNoteChanges,
                    width: Math.max(
                        180,
                        stickyNoteChanges.width
                            ?? node.stickyNote?.width
                            ?? DEFAULT_STICKY_NOTE.width,
                    ),
                    height: Math.max(
                        120,
                        stickyNoteChanges.height
                            ?? node.stickyNote?.height
                            ?? DEFAULT_STICKY_NOTE.height,
                    ),
                },
            };
        }));
    }, [readOnly, recordBurstHistory, setNodes]);

    const updateStickyNoteColor = useCallback((nodeId: string, color: StickyNoteColor) => {
        updateStickyNote(nodeId, { color });
    }, [updateStickyNote]);

    return { addStickyNote, updateStickyNote, updateStickyNoteColor };
}
