import { useCallback, useEffect, useState } from 'react';

interface Identifiable {
    id: Id;
}

function readItemFromUrl<T extends Identifiable>(items: T[], param: string): T | null {
    const id = new URLSearchParams(window.location.search).get(param);
    if (!id) return null;

    return items.find(item => String(item.id) === id) ?? null;
}

function updateUrl(param: string, id: Id | null) {
    const url = new URL(window.location.href);
    if (id === null) {
        url.searchParams.delete(param);
    } else {
        url.searchParams.set(param, String(id));
    }
    window.history.replaceState(window.history.state, '', url.toString());
}

// Keeps an item-backed modal shareable without triggering an Inertia navigation.
export function useUrlSyncedModal<T extends Identifiable>(items: T[], param: string) {
    const [selectedItem, setSelectedItem] = useState<T | null>(() => readItemFromUrl(items, param));

    useEffect(() => {
        const syncFromUrl = () => setSelectedItem(readItemFromUrl(items, param));
        syncFromUrl();
        window.addEventListener('popstate', syncFromUrl);
        return () => window.removeEventListener('popstate', syncFromUrl);
    }, [items, param]);

    const openModal = useCallback((item: T) => {
        setSelectedItem(item);
        updateUrl(param, item.id);
    }, [param]);

    const closeModal = useCallback(() => {
        setSelectedItem(null);
        updateUrl(param, null);
    }, [param]);

    return {
        selectedItem,
        openModal,
        closeModal,
    };
}
