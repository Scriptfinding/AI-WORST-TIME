import { useState } from 'react';
import type { MembersTab } from './types';
import { getInitialMembersTab } from './utils';

// Keeps the available members section synchronized with the tab query parameter.
export function useWorkspaceMembersTab() {
    const [activeTab, setActiveTab] = useState<MembersTab>(() =>
        typeof window === 'undefined' ? 'users' : getInitialMembersTab(window.location.search),
    );

    const handleTabChange = (tab: MembersTab) => {
        setActiveTab(tab);
        if (typeof window === 'undefined') return;

        const url = new URL(window.location.href);
        if (tab === 'users') {
            url.searchParams.delete('tab');
        } else {
            url.searchParams.set('tab', tab);
        }
        window.history.replaceState(null, '', url.toString());
    };

    return { activeTab, handleTabChange };
}
