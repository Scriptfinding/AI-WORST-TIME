import { useCallback, useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import type { Flow } from '@/Domains/Flow/types';
import type { Folder, FolderTree } from '@/Domains/Folder/types';
import type { User } from '@/App/types';
import {
    countFolderDescendants,
    findFolderNode,
    getDefaultFolderTree,
    toggleSetValue,
} from './utils';

interface Options {
    flows: Flow[];
    folders: Folder[];
    folderTrees: FolderTree[];
    user: User | null;
}

// Resolves explorer selection from the URL and keeps folder navigation consistent.
export function useExplorerSelection({ flows, folders, folderTrees, user }: Options) {
    const [selectedFlowIds, setSelectedFlowIds] = useState<Set<Id>>(() => new Set());
    const [selectedFolderIds, setSelectedFolderIds] = useState<Set<Id>>(() => new Set());
    const [deletingSelected, setDeletingSelected] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [confirmNestedDelete, setConfirmNestedDelete] = useState(false);

    const selectedFlows = flows.filter(flow => selectedFlowIds.has(flow.id));
    const selectedFolders = folders.filter(folder => selectedFolderIds.has(folder.id));
    const selectedCount = selectedFlowIds.size + selectedFolderIds.size;
    const selectionActive = selectedCount > 0;

    const canSelectFlow = useCallback((flow: Flow) => Boolean(
        user && (
            user.role === 'admin'
            || user.workspace_role === 'admin'
            || flow.owner_id === user.id
        )
    ), [user]);

    const selectableFlows = flows.filter(canSelectFlow);
    const selectableFolders = folders.filter(folder => !(folder.team_id && !folder.parent_id));
    const selectableVisibleCount = selectableFlows.length + selectableFolders.length;
    const allVisibleSelected = selectableVisibleCount > 0
        && selectableFlows.every(flow => selectedFlowIds.has(flow.id))
        && selectableFolders.every(folder => selectedFolderIds.has(folder.id));

    const selectedFolderImpacts = selectedFolders.map(folder => ({
        folder,
        counts: countFolderDescendants(
            findFolderNode(folderTrees, folder.id) ?? getDefaultFolderTree(folder),
        ),
    }));
    const hasSelectedFolderWithChildren = selectedFolderImpacts.some(
        ({ counts }) => counts.folders > 0 || counts.flows > 0,
    );
    const selectedFolderTotals = selectedFolderImpacts.reduce(
        (acc, { counts }) => ({
            folders: acc.folders + counts.folders,
            flows: acc.flows + counts.flows,
        }),
        { folders: 0, flows: 0 },
    );

    useEffect(() => {
        setSelectedFlowIds(previous => {
            const visibleIds = new Set(flows.map(flow => flow.id));
            const next = new Set([...previous].filter(id => visibleIds.has(id)));
            return next.size === previous.size ? previous : next;
        });
        setSelectedFolderIds(previous => {
            const visibleIds = new Set(folders.map(folder => folder.id));
            const next = new Set([...previous].filter(id => visibleIds.has(id)));
            return next.size === previous.size ? previous : next;
        });
    }, [flows, folders]);

    const clearSelection = useCallback(() => {
        setSelectedFlowIds(new Set());
        setSelectedFolderIds(new Set());
        setConfirmNestedDelete(false);
    }, []);

    useEffect(() => {
        if (!selectionActive) return;

        const handleEscapeSelection = (event: KeyboardEvent) => {
            const hasOpenModal = document.querySelector('[data-modal-overlay]') !== null;
            if (event.key !== 'Escape' || hasOpenModal) return;
            clearSelection();
        };
        document.addEventListener('keydown', handleEscapeSelection);
        return () => document.removeEventListener('keydown', handleEscapeSelection);
    }, [clearSelection, selectionActive]);

    const toggleSelectAllVisible = useCallback(() => {
        setSelectedFlowIds(previous => {
            const next = new Set(previous);
            selectableFlows.forEach(flow => {
                if (allVisibleSelected) next.delete(flow.id);
                else next.add(flow.id);
            });
            return next;
        });
        setSelectedFolderIds(previous => {
            const next = new Set(previous);
            selectableFolders.forEach(folder => {
                if (allVisibleSelected) next.delete(folder.id);
                else next.add(folder.id);
            });
            return next;
        });
    }, [allVisibleSelected, selectableFlows, selectableFolders]);

    const toggleFlowSelection = useCallback((flow: Flow) => {
        setSelectedFlowIds(previous => toggleSetValue(previous, flow.id));
    }, []);

    const toggleFolderSelection = useCallback((folder: Folder) => {
        setSelectedFolderIds(previous => toggleSetValue(previous, folder.id));
    }, []);

    const openDeleteModal = useCallback(() => {
        if (selectedCount === 0) return;
        setConfirmNestedDelete(false);
        setDeleteModalOpen(true);
    }, [selectedCount]);

    const closeDeleteModal = useCallback(() => {
        setDeleteModalOpen(false);
        setConfirmNestedDelete(false);
    }, []);

    const confirmDeleteSelected = useCallback(() => {
        if (selectedCount === 0 || (hasSelectedFolderWithChildren && !confirmNestedDelete)) return;
        setDeletingSelected(true);

        router.post('/flows/batch-delete', {
            ids: selectedFlows.map(flow => flow.id),
            folder_ids: selectedFolders.map(folder => folder.id),
        }, {
            preserveState: false,
            onSuccess: () => {
                setSelectedFlowIds(new Set());
                setSelectedFolderIds(new Set());
                closeDeleteModal();
            },
            onFinish: () => setDeletingSelected(false),
        });
    }, [
        closeDeleteModal,
        confirmNestedDelete,
        hasSelectedFolderWithChildren,
        selectedCount,
        selectedFlows,
        selectedFolders,
    ]);

    return {
        selectedFlowIds,
        selectedFolderIds,
        selectedFlows,
        selectedFolders,
        selectedCount,
        selectionActive,
        selectableVisibleCount,
        allVisibleSelected,
        deletingSelected,
        deleteModalOpen,
        confirmNestedDelete,
        selectedFolderTotals,
        hasSelectedFolderWithChildren,
        clearSelection,
        toggleSelectAllVisible,
        toggleFlowSelection,
        toggleFolderSelection,
        openDeleteModal,
        closeDeleteModal,
        confirmDeleteSelected,
        setConfirmNestedDelete,
    };
}
