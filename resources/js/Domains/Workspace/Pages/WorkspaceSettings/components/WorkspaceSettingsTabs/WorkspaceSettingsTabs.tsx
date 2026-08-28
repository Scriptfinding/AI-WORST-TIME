import { Icon } from '@/Shared/UI/Icon/Icon';
import { SettingsTab, SettingsTabs, SettingsTabsScroller } from '@/Shared/UI/SettingsTabs/styled';
import type { WorkspaceSettingsTab } from './useWorkspaceSettingsTab';

interface Props {
    activeTab: WorkspaceSettingsTab;
    privateLibrariesEnabled: boolean;
    mcpEnabled: boolean;
    onTabChange: (tab: WorkspaceSettingsTab) => void;
}

export default function WorkspaceSettingsTabs({
    activeTab,
    privateLibrariesEnabled,
    mcpEnabled,
    onTabChange,
}: Props) {
    return (
        <SettingsTabsScroller>
            <SettingsTabs>
                <SettingsTab $active={activeTab === 'general'} onClick={() => onTabChange('general')}>
                    <Icon icon="lucide:settings" width={14} height={14} />
                    General
                </SettingsTab>
                <SettingsTab $active={activeTab === 'flows'} onClick={() => onTabChange('flows')}>
                    <Icon icon="lucide:workflow" width={14} height={14} />
                    Flows
                </SettingsTab>
                <SettingsTab $active={activeTab === 'proxies'} onClick={() => onTabChange('proxies')}>
                    <Icon icon="lucide:network" width={14} height={14} />
                    Proxies
                </SettingsTab>
                {privateLibrariesEnabled && (
                    <SettingsTab
                        $active={activeTab === 'private-libraries'}
                        onClick={() => onTabChange('private-libraries')}
                    >
                        <Icon icon="lucide:git-branch" width={14} height={14} />
                        Private Libraries
                    </SettingsTab>
                )}
                {mcpEnabled && (
                    <SettingsTab $active={activeTab === 'mcp'} onClick={() => onTabChange('mcp')}>
                        <Icon icon="lucide:plug-zap" width={14} height={14} />
                        Instance MCP
                    </SettingsTab>
                )}
            </SettingsTabs>
        </SettingsTabsScroller>
    );
}
