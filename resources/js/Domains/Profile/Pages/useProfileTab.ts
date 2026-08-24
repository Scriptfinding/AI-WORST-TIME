import { useState } from 'react';

export type ProfileTab = 'general' | 'security' | 'api';

function getInitialTab(): ProfileTab {
    if (typeof window === 'undefined') return 'general';

    const tab = new URLSearchParams(window.location.search).get('tab');
    return tab === 'security' || tab === 'api' ? tab : 'general';
}

// Keeps the active profile section synchronized with the tab query parameter.
export function useProfileTab() {
    const [activeTab, setActiveTab] = useState<ProfileTab>(getInitialTab);

    const changeTab = (tab: ProfileTab) => {
        setActiveTab(tab);

        const url = new URL(window.location.href);
        if (tab === 'general') {
            url.searchParams.delete('tab');
        } else {
            url.searchParams.set('tab', tab);
        }
        window.history.replaceState(null, '', url.toString());
    };

    return { activeTab, changeTab };
}
