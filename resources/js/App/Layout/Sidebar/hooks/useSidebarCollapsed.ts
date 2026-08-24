import { useState } from 'react';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

function getInitialCollapsed(): boolean {
    try {
        return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
        return false;
    }
}

// Persists and toggles the sidebar's collapsed presentation state.
export function useSidebarCollapsed() {
    const [collapsed, setCollapsed] = useState(getInitialCollapsed);

    const toggleCollapsed = () => {
        setCollapsed(previous => {
            const next = !previous;

            try {
                localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
            } catch {
                // The sidebar still works when storage is unavailable.
            }

            return next;
        });
    };

    return { collapsed, toggleCollapsed };
}
