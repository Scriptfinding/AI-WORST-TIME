import { useCallback, useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import type { Folder } from '@/Domains/Folder/types';
import {
    getFlowMovePayload,
    getFolderDropTarget,
    isSameDropScope,
    type FolderDropTarget,
} from './utils';

export interface PendingMove {
    flowId: Id;
    fromScope: string;
    target: FolderDropTarget;
}

// Handles folder drop targets and confirms flow moves that cross visibility scopes.
export function useFolderItemDnd(folder: Folder, isWorkspaceView = false) {
    const [dragOver, setDragOver] = useState(false);
    const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

    useEffect(() => {
        const reset = () => setDragOver(false);
        document.addEventListener('dragend', reset);
        return () => document.removeEventListener('dragend', reset);
    }, []);

    const executeFlowMove = useCallback((flowId: Id, changeVisibility: boolean) => {
        const target = getFolderDropTarget(folder, isWorkspaceView);
        router.patch(`/flows/${flowId}/move`, getFlowMovePayload(target, changeVisibility), {
            preserveState: true,
        });
    }, [folder, isWorkspaceView]);

    const onDragStart = useCallback((event: React.DragEvent) => {
        event.dataTransfer.setData('application/x-drag-type', 'folder');
        event.dataTransfer.setData('application/x-drag-id', String(folder.id));
        event.dataTransfer.effectAllowed = 'move';
    }, [folder.id]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        setDragOver(true);
    }, []);

    const onDragLeave = useCallback((event: React.DragEvent) => {
        event.stopPropagation();
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(false);
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setDragOver(false);

        const type = event.dataTransfer.getData('application/x-drag-type');
        const draggedId = event.dataTransfer.getData('application/x-drag-id');
        if (!type || !draggedId || (type === 'folder' && draggedId === String(folder.id))) return;

        if (type === 'folder') {
            router.patch(`/folders/${draggedId}/move`, { parent_id: folder.id }, { preserveState: true });
            return;
        }
        if (type !== 'flow') return;

        const flowScope = event.dataTransfer.getData('application/x-drag-visibility');
        const flowTeamId = event.dataTransfer.getData('application/x-drag-team-id');
        const target = getFolderDropTarget(folder, isWorkspaceView);

        if (isSameDropScope(flowScope, flowTeamId, target)) {
            executeFlowMove(draggedId, false);
        } else {
            setPendingMove({ flowId: draggedId, fromScope: flowScope || 'owner', target });
        }
    }, [executeFlowMove, folder, isWorkspaceView]);

    const confirmVisibilityChange = useCallback((move: PendingMove) => {
        executeFlowMove(move.flowId, true);
        setPendingMove(null);
    }, [executeFlowMove]);

    return {
        dragOver,
        pendingMove,
        onDragStart,
        onDragOver,
        onDragLeave,
        onDrop,
        closeVisibilityConfirmation: () => setPendingMove(null),
        confirmVisibilityChange,
    };
}
