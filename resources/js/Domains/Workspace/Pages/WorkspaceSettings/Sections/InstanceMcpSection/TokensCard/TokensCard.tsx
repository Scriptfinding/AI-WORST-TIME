import React, { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import { useToast } from '@/App/Hooks/useToast';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { McpAccessToken } from '@/Domains/Workspace/types';
import * as SharedS from '@/Domains/Workspace/Pages/WorkspaceSettings/shared.styled';
import { formatDate, requestJson } from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/InstanceMcpSection/utils';
import * as S from './styled';

interface Props {
    endpoint: string;
    tokens: McpAccessToken[];
    busy: boolean;
    tokenBusy: boolean;
    readOnly?: boolean;
    setBusy: (busy: boolean) => void;
    setTokenBusy: (busy: boolean) => void;
    setOauthClientBusy: (busy: boolean) => void;
    setError: (error: string | null) => void;
}

export default function TokensCard({ endpoint, tokens, busy, tokenBusy, readOnly, setBusy, setTokenBusy, setOauthClientBusy, setError }: Props) {
    const { confirm, ConfirmModal } = useConfirm();
    const { toast } = useToast();
    const [currentTokens, setCurrentTokens] = useState(tokens);
    const [tokenName, setTokenName] = useState('');
    const [plainToken, setPlainToken] = useState<string | null>(null);

    const createToken = async (event: React.FormEvent) => {
        event.preventDefault();
        if (readOnly || busy || !tokenName.trim()) return;

        setBusy(true);
        setTokenBusy(true);
        setError(null);
        setPlainToken(null);
        try {
            const payload = await requestJson('/workspace/mcp/tokens', {
                method: 'POST',
                body: JSON.stringify({ name: tokenName.trim() }),
            });
            setCurrentTokens(current => [payload.token, ...current]);
            setPlainToken(payload.plain_token);
            setTokenName('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to create MCP token.');
        } finally {
            setTokenBusy(false);
            setBusy(false);
        }
    };

    const revokeToken = async (token: McpAccessToken) => {
        if (readOnly || busy) return;

        const ok = await confirm({
            title: 'Revoke MCP token',
            message: `Revoke access for "${token.name}"? Connected clients using this token will stop working.`,
            confirmLabel: 'Revoke token',
            variant: 'danger',
        });
        if (!ok) return;

        setBusy(true);
        setOauthClientBusy(true);
        setError(null);
        try {
            await requestJson(`/workspace/mcp/tokens/${token.id}`, { method: 'DELETE' });
            setCurrentTokens(current => current.filter(item => item.id !== token.id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to revoke MCP token.');
        } finally {
            setBusy(false);
        }
    };

    const copyToken = async () => {
        if (!plainToken) return;

        try {
            await navigator.clipboard.writeText(plainToken);
            toast('Token copied to clipboard');
        } catch {
            toast('Unable to copy token', 'error');
        }
    };

    return (
        <>
            <SharedS.Card>
                <S.ModeLabel>Manual mode</S.ModeLabel>
                <SharedS.CardTitle>
                    <Icon icon="lucide:key-round" width={15} height={15} />
                    Access Token Endpoint
                </SharedS.CardTitle>
                <S.SectionHint>
                    Use this mode for CLI tools, self-hosted agents or clients where copying a bearer token is acceptable. The token is tied to one user and this workspace.
                </S.SectionHint>
                <S.EndpointBox>
                    <Input label="HTTP MCP endpoint" value={endpoint} readOnly />
                    <S.SettingsInlineHint>Authenticate with `Authorization: Bearer mcp_...`.</S.SettingsInlineHint>
                </S.EndpointBox>
                {!readOnly && (
                    <S.Form onSubmit={createToken}>
                        <S.FormRow>
                            <Input
                                label="Client name"
                                value={tokenName}
                                onChange={event => setTokenName(event.target.value)}
                                placeholder="Claude Desktop"
                            />
                            <Button type="submit" size="sm" loading={tokenBusy} disabled={busy || !tokenName.trim()}>
                                <Icon icon="lucide:plus" width={14} />
                                Create token
                            </Button>
                        </S.FormRow>
                    </S.Form>
                )}
                {plainToken && (
                    <S.SuccessBox>
                        <strong>Copy this token now.</strong>
                        <S.TokenValueRow>
                            <code>{plainToken}</code>
                            <Button type="button" variant="secondary" size="sm" onClick={() => void copyToken()}>
                                <Icon icon="lucide:copy" width={14} height={14} />
                                Copy
                            </Button>
                        </S.TokenValueRow>
                    </S.SuccessBox>
                )}
                {currentTokens.length === 0 ? (
                    <S.EmptyState>No MCP tokens created.</S.EmptyState>
                ) : (
                    <S.TokenList>
                        {currentTokens.map(token => (
                            <S.TokenItem key={token.id}>
                                <S.TokenMain>
                                    <S.TokenHeader>
                                        <S.TokenName>{token.name}</S.TokenName>
                                        <S.TokenPreview>{token.token_preview}</S.TokenPreview>
                                    </S.TokenHeader>
                                    <S.TokenMeta>
                                        <span>Owner: {token.user?.name || '-'}</span>
                                        <span>Last used: {formatDate(token.last_used_at)}</span>
                                        <span>Created: {formatDate(token.created_at)}</span>
                                    </S.TokenMeta>
                                </S.TokenMain>
                                {!readOnly && (
                                    <Button type="button" variant="ghost" size="sm" onClick={() => void revokeToken(token)}>
                                        <Icon icon="lucide:ban" width={13} />
                                        Revoke
                                    </Button>
                                )}
                            </S.TokenItem>
                        ))}
                    </S.TokenList>
                )}
            </SharedS.Card>
            <ConfirmModal />
        </>
    );
}
