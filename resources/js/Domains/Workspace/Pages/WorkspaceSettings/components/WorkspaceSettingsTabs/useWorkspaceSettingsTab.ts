import { useState } from 'react';

export type WorkspaceSettingsTab = 'general' | 'flows' | 'proxies' | 'mcp' | 'private-libraries';

function getInitialSettingsTab(
    privateLibrariesEnabled: boolean,
    mcpEnabled: boolean,
): WorkspaceSettingsTab {
    if (typeof window === 'undefined') return 'general';

    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'flows') return 'flows';
    if (tab === 'proxies') return 'proxies';
    if (tab === 'mcp' && mcpEnabled) return 'mcp';
    if (tab === 'private-libraries' && privateLibrariesEnabled) return 'private-libraries';
    return 'general';
}

// Keeps the enabled workspace settings section synchronized with the URL.
export function useWorkspaceSettingsTab(privateLibrariesEnabled: boolean, mcpEnabled: boolean) {
    const [activeTab, setActiveTab] = useState<WorkspaceSettingsTab>(() =>
        getInitialSettingsTab(privateLibrariesEnabled, mcpEnabled),
    );

    const handleTabChange = (tab: WorkspaceSettingsTab) => {
        setActiveTab(tab);
        if (typeof window === 'undefined') return;

        const url = new URL(window.location.href);
        if (tab === 'general') {
            url.searchParams.delete('tab');
        } else {
            url.searchParams.set('tab', tab);
        }
        window.history.replaceState(null, '', url.toString());
    };

    return { activeTab, handleTabChange };
}
