import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import PrivateLibrariesSection, { type PrivateLibrary } from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/PrivateLibrariesSection.pp';
import InstanceMcpSection from './Sections/InstanceMcpSection/InstanceMcpSection';
import ProxiesSection from './Sections/ProxiesSection/ProxiesSection';
import type { McpAccessToken, McpFlow, McpOauthClient, McpOauthConnection, McpTool, Workspace, WorkspaceMcpSettings, WorkspaceProxy } from '@/Domains/Workspace/types';
import FlowsSettingsTab from './components/FlowsSettingsTab/FlowsSettingsTab';
import GeneralSettingsTab from './components/GeneralSettingsTab/GeneralSettingsTab';
import WorkspaceSettingsTabs from './components/WorkspaceSettingsTabs/WorkspaceSettingsTabs';
import { useWorkspaceSettingsTab } from './components/WorkspaceSettingsTabs/useWorkspaceSettingsTab';

interface Props {
    workspace: Workspace;
    isWorkspaceAdmin: boolean;
    isOwner: boolean;
    proxies: WorkspaceProxy[];
    privateLibrariesEnabled: boolean;
    mcpEnabled: boolean;
    privateLibraries: PrivateLibrary[];
    teams: { id: Id; name: string }[];
    mcpEndpoint: string;
    mcpOauthEndpoint: string;
    mcpOauthAuthorizeUrl: string;
    mcpOauthTokenUrl: string;
    mcpSettings: WorkspaceMcpSettings;
    mcpTools: McpTool[];
    mcpTokens: McpAccessToken[];
    mcpOauthClients: McpOauthClient[];
    mcpOauthConnections: McpOauthConnection[];
    mcpFlows: McpFlow[];
}

export default function WorkspaceSettings({ workspace, isWorkspaceAdmin, isOwner, proxies, privateLibrariesEnabled, mcpEnabled, privateLibraries, teams, mcpEndpoint, mcpOauthEndpoint, mcpOauthAuthorizeUrl, mcpOauthTokenUrl, mcpSettings, mcpTools, mcpTokens, mcpOauthClients, mcpOauthConnections, mcpFlows }: Props) {
    const { activeTab, handleTabChange } = useWorkspaceSettingsTab(privateLibrariesEnabled, mcpEnabled);

    return (
        <AppLayout title="Workspace Settings">
            <WorkspaceSettingsTabs
                activeTab={activeTab}
                privateLibrariesEnabled={privateLibrariesEnabled}
                mcpEnabled={mcpEnabled}
                onTabChange={handleTabChange}
            />

            {activeTab === 'general' && (
                <GeneralSettingsTab
                    workspace={workspace}
                    isWorkspaceAdmin={isWorkspaceAdmin}
                    isOwner={isOwner}
                />
            )}

            {activeTab === 'flows' && (
                <FlowsSettingsTab workspace={workspace} readOnly={!isWorkspaceAdmin} />
            )}

            {activeTab === 'proxies' && (
                <ProxiesSection proxies={proxies} teams={teams} readOnly={!isWorkspaceAdmin} />
            )}

            {mcpEnabled && activeTab === 'mcp' && (
                <InstanceMcpSection
                    endpoint={mcpEndpoint}
                    oauthEndpoint={mcpOauthEndpoint}
                    oauthAuthorizeUrl={mcpOauthAuthorizeUrl}
                    oauthTokenUrl={mcpOauthTokenUrl}
                    settings={mcpSettings}
                    tools={mcpTools}
                    tokens={mcpTokens}
                    oauthClients={mcpOauthClients}
                    oauthConnections={mcpOauthConnections}
                    flows={mcpFlows}
                    readOnly={!isWorkspaceAdmin}
                />
            )}

            {privateLibrariesEnabled && activeTab === 'private-libraries' && (
                <PrivateLibrariesSection libraries={privateLibraries} teams={teams} readOnly={!isWorkspaceAdmin} />
            )}
        </AppLayout>
    );
}
