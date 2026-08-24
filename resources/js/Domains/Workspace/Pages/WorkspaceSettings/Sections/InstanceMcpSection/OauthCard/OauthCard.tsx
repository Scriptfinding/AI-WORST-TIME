import React, { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { McpOauthClient, McpOauthConnection } from '@/Domains/Workspace/types';
import * as SharedS from '@/Domains/Workspace/Pages/WorkspaceSettings/shared.styled';
import { formatDate, requestJson } from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/InstanceMcpSection/utils';
import * as S from './styled';

interface Props {
    endpoint: string;
    authorizeUrl: string;
    tokenUrl: string;
    oauthClients: McpOauthClient[];
    oauthConnections: McpOauthConnection[];
    busy: boolean;
    clientBusy: boolean;
    readOnly?: boolean;
    setBusy: (busy: boolean) => void;
    setClientBusy: (busy: boolean) => void;
    setError: (error: string | null) => void;
}

export default function OauthCard({ endpoint, authorizeUrl, tokenUrl, oauthClients, oauthConnections, busy, clientBusy, readOnly, setBusy, setClientBusy, setError }: Props) {
    const { confirm, ConfirmModal } = useConfirm();
    const [currentClients, setCurrentClients] = useState(oauthClients);
    const [currentConnections, setCurrentConnections] = useState(oauthConnections);
    const [clientName, setClientName] = useState('');
    const [redirectUri, setRedirectUri] = useState('');

    const createClient = async (event: React.FormEvent) => {
        event.preventDefault();
        if (readOnly || busy || !clientName.trim() || !redirectUri.trim()) return;

        setBusy(true);
        setError(null);
        try {
            const payload = await requestJson('/workspace/mcp/oauth-clients', {
                method: 'POST',
                body: JSON.stringify({
                    name: clientName.trim(),
                    redirect_uri: redirectUri.trim(),
                }),
            });
            setCurrentClients(current => [payload, ...current]);
            setClientName('');
            setRedirectUri('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to create OAuth client.');
        } finally {
            setClientBusy(false);
            setBusy(false);
        }
    };

    const revokeClient = async (client: McpOauthClient) => {
        if (readOnly || busy) return;

        const ok = await confirm({
            title: 'Revoke OAuth client',
            message: `Revoke "${client.name}"? This also revokes its active OAuth connections.`,
            confirmLabel: 'Revoke client',
            variant: 'danger',
        });
        if (!ok) return;

        setBusy(true);
        setError(null);
        try {
            await requestJson(`/workspace/mcp/oauth-clients/${client.id}`, { method: 'DELETE' });
            setCurrentClients(current => current.filter(item => item.id !== client.id));
            setCurrentConnections(current => current.filter(item => item.oauth_client_id !== client.oauth_client_id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to revoke OAuth client.');
        } finally {
            setBusy(false);
        }
    };

    const revokeConnection = async (connection: McpOauthConnection) => {
        if (readOnly || busy) return;

        const ok = await confirm({
            title: 'Revoke OAuth connection',
            message: `Revoke access for "${connection.client_name}"?`,
            confirmLabel: 'Revoke connection',
            variant: 'danger',
        });
        if (!ok) return;

        setBusy(true);
        setError(null);
        try {
            await requestJson(`/workspace/mcp/oauth-connections/${connection.id}`, { method: 'DELETE' });
            setCurrentConnections(current => current.filter(item => item.id !== connection.id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to revoke OAuth connection.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <SharedS.Card>
                <S.ModeLabel>Recommended app mode</S.ModeLabel>
                <SharedS.CardTitle>
                    <Icon icon="lucide:shield-check" width={15} height={15} />
                    OAuth2 Clients Endpoint
                </SharedS.CardTitle>
                <S.SectionHint>
                    Use this mode for MCP clients that support OAuth2. Users authorize the client with PKCE, and connected clients can be revoked without copying tokens manually.
                </S.SectionHint>
                <S.EndpointGrid>
                    <Input label="OAuth MCP endpoint" value={endpoint} readOnly />
                    <Input label="Authorize URL" value={authorizeUrl} readOnly />
                    <Input label="Token URL" value={tokenUrl} readOnly />
                </S.EndpointGrid>

                {!readOnly && (
                    <S.Form onSubmit={createClient}>
                        <S.ClientForm>
                            <Input
                                label="Client name"
                                value={clientName}
                                onChange={event => setClientName(event.target.value)}
                                placeholder="Claude Desktop OAuth"
                            />
                            <Input
                                label="Redirect URI"
                                value={redirectUri}
                                onChange={event => setRedirectUri(event.target.value)}
                                placeholder="https://client.example.com/oauth/callback"
                            />
                            <Button type="submit" size="sm" loading={clientBusy} disabled={busy || !clientName.trim() || !redirectUri.trim()}>
                                <Icon icon="lucide:plus" width={14} />
                                Create OAuth client
                            </Button>
                        </S.ClientForm>
                    </S.Form>
                )}

                <S.Columns>
                    <S.Column>
                        <S.SubsectionTitle>Configured OAuth clients</S.SubsectionTitle>
                        {currentClients.length === 0 ? (
                            <S.EmptyState>No OAuth clients configured.</S.EmptyState>
                        ) : (
                            <S.ItemList>
                                {currentClients.map(client => (
                                    <S.Item key={client.id}>
                                        <S.ItemMain>
                                            <S.ItemHeader>
                                                <S.ItemName>{client.name}</S.ItemName>
                                                <S.ItemPreview>{client.oauth_client_id}</S.ItemPreview>
                                            </S.ItemHeader>
                                            <S.ItemMeta>
                                                <span>Owner: {client.user?.name || '-'}</span>
                                                <span>Redirect: {client.redirect_uri}</span>
                                                <span>Created: {formatDate(client.created_at)}</span>
                                            </S.ItemMeta>
                                        </S.ItemMain>
                                        {!readOnly && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => void revokeClient(client)}>
                                                <Icon icon="lucide:ban" width={13} />
                                                Revoke
                                            </Button>
                                        )}
                                    </S.Item>
                                ))}
                            </S.ItemList>
                        )}
                    </S.Column>

                    <S.Column>
                        <S.SubsectionTitle>OAuth connected clients</S.SubsectionTitle>
                        {currentConnections.length === 0 ? (
                            <S.EmptyState>No OAuth clients connected yet.</S.EmptyState>
                        ) : (
                            <S.ItemList>
                                {currentConnections.map(connection => (
                                    <S.Item key={connection.id}>
                                        <S.ItemMain>
                                            <S.ItemHeader>
                                                <S.ItemName>{connection.client_name}</S.ItemName>
                                                <S.ItemPreview>{connection.oauth_client_id}</S.ItemPreview>
                                            </S.ItemHeader>
                                            <S.ItemMeta>
                                                <span>User: {connection.user?.name || '-'}</span>
                                                <span>Last used: {formatDate(connection.last_used_at)}</span>
                                                <span>Created: {formatDate(connection.created_at)}</span>
                                            </S.ItemMeta>
                                        </S.ItemMain>
                                        {!readOnly && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => void revokeConnection(connection)}>
                                                <Icon icon="lucide:ban" width={13} />
                                                Revoke
                                            </Button>
                                        )}
                                    </S.Item>
                                ))}
                            </S.ItemList>
                        )}
                    </S.Column>
                </S.Columns>
            </SharedS.Card>
            <ConfirmModal />
        </>
    );
}
