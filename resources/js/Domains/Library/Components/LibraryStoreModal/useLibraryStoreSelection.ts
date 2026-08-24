import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LibraryCollection, LibraryStoreChild, LibraryStoreItem } from './types';
import {
    closeLibraryStoreQuery,
    getBlueprintNamespaceFromQuery,
    syncLibraryStoreQuery,
} from './utils';

export interface LibraryPendingUse {
    item: LibraryStoreItem;
    collection: LibraryCollection;
    child: LibraryStoreChild;
}

// Synchronizes library item selection and pending imports with the modal URL state.
export function useLibraryStoreSelection(
    isOpen: boolean,
    items: LibraryStoreItem[],
    onClose: () => void,
) {
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const [pendingUse, setPendingUse] = useState<LibraryPendingUse | null>(null);
    const activeItem = useMemo(
        () => activeKey ? items.find(item => item.key === activeKey) || null : null,
        [activeKey, items],
    );

    useEffect(() => {
        if (!isOpen) {
            setActiveKey(null);
            setPendingUse(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const blueprintNamespace = getBlueprintNamespaceFromQuery();
        if (!blueprintNamespace) {
            setActiveKey(null);
            return;
        }

        if (!items.length) return;

        const queriedItem = items.find(item => (
            item.namespace === blueprintNamespace
            || item.reference === blueprintNamespace
            || item.key === blueprintNamespace
        ));
        setActiveKey(queriedItem?.key ?? null);
    }, [isOpen, items]);

    const close = useCallback(() => {
        closeLibraryStoreQuery();
        onClose();
    }, [onClose]);

    const back = useCallback(() => {
        setActiveKey(null);
        syncLibraryStoreQuery(null);
    }, []);

    const explore = useCallback((item: LibraryStoreItem) => {
        setActiveKey(item.key);
        syncLibraryStoreQuery(item.key);
    }, []);

    const selectForUse = useCallback((
        item: LibraryStoreItem,
        collection: LibraryCollection,
        reference: string,
    ) => {
        const child = item[collection].find(candidate => candidate.reference === reference);
        if (child && !child.is_installed) setPendingUse({ item, collection, child });
    }, []);

    return {
        activeItem,
        pendingUse,
        setPendingUse,
        close,
        back,
        explore,
        selectForUse,
    };
}
