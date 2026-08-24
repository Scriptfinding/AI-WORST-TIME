import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import type { FolderTree } from '@/Domains/Folder/types';
import type {
    FolderScope,
    FolderSelection,
    WorkspaceFolderPickerProps,
} from '@/Domains/Folder/Components/WorkspaceFolderPicker/types';
import { findName, insertIntoTree } from '@/Domains/Folder/Components/WorkspaceFolderPicker/utils';

interface UseFolderPickerOptions {
    workspaceTree: FolderTree[];
    rootFolderId?: Id | null;
    rootLabel: string;
    scope?: FolderScope;
    ownerId?: Id | null;
    onConfirm: WorkspaceFolderPickerProps['onConfirm'];
}

// Manages folder selection and inline folder creation for WorkspaceFolderPicker.
export function useFolderPicker({
    workspaceTree,
    rootFolderId,
    rootLabel,
    scope,
    ownerId,
    onConfirm,
}: UseFolderPickerOptions) {
    const [selectedId, setSelectedId] = useState<FolderSelection>(null);
    const [localTree, setLocalTree] = useState(workspaceTree);
    const [creatingInId, setCreatingInId] = useState<Id | null>(null);
    const [creatingAtRoot, setCreatingAtRoot] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [creatingSaving, setCreatingSaving] = useState(false);

    useEffect(() => {
        setLocalTree(workspaceTree);
    }, [workspaceTree]);

    const cancelCreate = useCallback(() => {
        setCreatingInId(null);
        setCreatingAtRoot(false);
        setNewFolderName('');
    }, []);

    const reset = useCallback(() => {
        setSelectedId(null);
        cancelCreate();
    }, [cancelCreate]);

    const startCreate = useCallback((parentId: Id) => {
        setCreatingAtRoot(false);
        setCreatingInId(parentId);
        setNewFolderName('');
    }, []);

    const startCreateRoot = useCallback(() => {
        setCreatingInId(null);
        setCreatingAtRoot(true);
        setNewFolderName('');
    }, []);

    const confirm = useCallback(() => {
        if (selectedId === null) {
            return;
        }

        if (selectedId === 'root') {
            onConfirm(null, rootLabel);
            return;
        }

        onConfirm(selectedId, findName(localTree, selectedId));
    }, [localTree, onConfirm, rootLabel, selectedId]);

    const createFolder = useCallback(async () => {
        const name = newFolderName.trim();
        if (!name || creatingSaving) {
            return;
        }

        setCreatingSaving(true);

        try {
            const parentId = creatingAtRoot
                ? (rootFolderId ?? null)
                : creatingInId;
            const { data } = await axios.post('/folders', {
                name,
                parent_id: parentId,
                is_shared: scope !== 'owner',
                ...(scope === 'owner' && ownerId && { owner_id: ownerId }),
            });
            const newFolder: FolderTree = {
                id: data.id,
                name: data.name,
                parent_id: data.parent_id,
                children: [],
                flows: [],
            };

            setLocalTree(currentTree =>
                !creatingAtRoot && parentId
                    ? insertIntoTree(currentTree, parentId, newFolder)
                    : [...currentTree, newFolder],
            );
            setSelectedId(data.id);
            cancelCreate();
        } catch {
            // Server validation errors are intentionally handled silently.
        } finally {
            setCreatingSaving(false);
        }
    }, [
        cancelCreate,
        creatingAtRoot,
        creatingInId,
        creatingSaving,
        newFolderName,
        ownerId,
        rootFolderId,
        scope,
    ]);

    return {
        cancelCreate,
        confirm,
        createFolder,
        creatingAtRoot,
        creatingInId,
        creatingSaving,
        localTree,
        newFolderName,
        reset,
        selectedId,
        selectFolder: setSelectedId,
        setNewFolderName,
        startCreate,
        startCreateRoot,
    };
}
