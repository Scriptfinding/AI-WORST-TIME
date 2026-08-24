import { useState } from 'react';
import type { McpAccessToken, McpFlow, McpOauthClient, McpOauthConnection, McpTool, WorkspaceMcpSettings } from '@/Domains/Workspace/types';
import * as SharedS from '@/Domains/Workspace/Pages/WorkspaceSettings/shared.styled';
import FlowsCard from './FlowsCard/FlowsCard';
import GeneralMcpCard from './GeneralMcpCard/GeneralMcpCard';
import OauthCard from './OauthCard/OauthCard';
import * as S from './styled';
import TokensCard from './TokensCard/TokensCard';
import ToolsCard from './ToolsCard/ToolsCard';
import { requestJson } from './utils';

interface Props {
    endpoint: string;
    oauthEndpoint: string;
    oauthAuthorizeUrl: string;
    oauthTokenUrl: string;
    settings: WorkspaceMcpSettings;
    tools: McpTool[];
    tokens: McpAccessToken[];
    oauthClients: McpOauthClient[];
    oauthConnections: McpOauthConnection[];
    flows: McpFlow[];
    readOnly?: boolean;
}

export default function InstanceMcpSection({
    endpoint,
    oauthEndpoint,
    oauthAuthorizeUrl,
    oauthTokenUrl,
    settings,
    tools,
    tokens,
    oauthClients,
    oauthConnections,
    flows,
    readOnly,
}: Props) {
    const [currentSettings, setCurrentSettings] = useState(settings);
    const [busy, setBusy] = useState(false);
    const [tokenBusy, setTokenBusy] = useState(false);
    const [oauthClientBusy, setOauthClientBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateSettings = async (patch: Partial<WorkspaceMcpSettings>) => {
        if (readOnly || busy) return;
        const next = { ...currentSettings, ...patch };

        setBusy(true);
        setError(null);
        try {
            const payload = await requestJson('/workspace/mcp', {
                method: 'PUT',
                body: JSON.stringify(next),
            });
            setCurrentSettings(payload);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to update MCP settings.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <S.Rows>
            <S.TopGrid>
                <GeneralMcpCard
                    settings={currentSettings}
                    busy={busy}
                    readOnly={readOnly}
                    onUpdate={updateSettings}
                />
            </S.TopGrid>

            <S.ConnectionModeGrid>
                <TokensCard
                    endpoint={endpoint}
                    tokens={tokens}
                    busy={busy}
                    tokenBusy={tokenBusy}
                    readOnly={readOnly}
                    setBusy={setBusy}
                    setTokenBusy={setTokenBusy}
                    setOauthClientBusy={setOauthClientBusy}
                    setError={setError}
                />
                <OauthCard
                    endpoint={oauthEndpoint}
                    authorizeUrl={oauthAuthorizeUrl}
                    tokenUrl={oauthTokenUrl}
                    oauthClients={oauthClients}
                    oauthConnections={oauthConnections}
                    busy={busy}
                    clientBusy={oauthClientBusy}
                    readOnly={readOnly}
                    setBusy={setBusy}
                    setClientBusy={setOauthClientBusy}
                    setError={setError}
                />
            </S.ConnectionModeGrid>

            <ToolsCard
                settings={currentSettings}
                tools={tools}
                busy={busy}
                readOnly={readOnly}
                onUpdate={updateSettings}
            />

            <SharedS.CardStack>
                <FlowsCard
                    flows={flows}
                    busy={busy}
                    error={error}
                    readOnly={readOnly}
                    setBusy={setBusy}
                    setError={setError}
                />
            </SharedS.CardStack>
        </S.Rows>
    );
}
