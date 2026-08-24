import { useEffect, useState } from 'react';

// Persists collapsed filter groups and reports whether nested groups should be hidden.
export function useCollapsedGroups(storageKey: string) {
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'));
        } catch {
            return new Set();
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify([...collapsedGroups]));
        } catch {}
    }, [collapsedGroups, storageKey]);

    const toggleGroup = (key: string) => {
        setCollapsedGroups(previous => {
            const next = new Set(previous);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const isGroupHidden = (key: string) => {
        const parts = key.split('/');
        for (let index = 1; index <= parts.length; index++) {
            const parentKey = parts.slice(0, index).join('/');
            if (collapsedGroups.has(parentKey)) return true;
        }
        return false;
    };

    return { collapsedGroups, isGroupHidden, toggleGroup };
}
