import { useEffect, useState } from 'react';
import Button from '@/Shared/UI/Button/Button';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Input, { Select } from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import Switch from '@/Shared/UI/Switch/Switch';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import GroupCombobox from '@/Domains/Variable/Pages/VariableFormModal/GroupCombobox';
import ScopePicker from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import type { WorkspaceProxy } from '@/Domains/Workspace/types';
import * as S from './styled';

type ProxyForm = {
    label: string;
    scheme: WorkspaceProxy['scheme'];
    host: string;
    port: string;
    authenticated: boolean;
    username: string;
    password: string;
    visibility: WorkspaceProxy['visibility'];
    user_id: Id | null;
    team_id: Id | null;
    group: string;
};

type ConnectionTestResult = {
    ok: boolean;
    message: string;
    ip?: string | null;
    latency_ms?: number;
};

interface WorkspaceProxyFormModalProps {
    isOpen: boolean;
    proxy?: WorkspaceProxy | null;
    teams: { id: Id; name: string }[];
    groups?: string[];
    zIndex?: number;
    onClose: () => void;
    onSaved: (proxy: WorkspaceProxy) => void;
}

const emptyForm: ProxyForm = {
    label: '',
    scheme: 'http',
    host: '',
    port: '8080',
    authenticated: false,
    username: '',
    password: '',
    visibility: 'owner',
    user_id: null,
    team_id: null,
    group: '',
};

async function saveProxy(proxy: WorkspaceProxy | null | undefined, form: ProxyForm) {
    const response = await fetch(
        proxy ? `/workspace/proxies/${proxy.id}` : '/workspace/proxies',
        {
            method: proxy ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...csrfHeaders(),
            },
            body: JSON.stringify({ ...form, port: Number(form.port) }),
        },
    );
    const payload = await response.json().catch(() => ({})) as WorkspaceProxy & {
        message?: string;
        errors?: Record<string, string[]>;
    };
    if (!response.ok) {
        const validationMessage = payload.errors
            ? Object.values(payload.errors).flat().find(message => typeof message === 'string')
            : null;
        throw new Error(validationMessage || payload.message || 'Unable to save this proxy.');
    }

    return payload;
}

function initialForm(proxy?: WorkspaceProxy | null): ProxyForm {
    if (!proxy) return emptyForm;

    return {
        label: proxy.label,
        scheme: proxy.scheme,
        host: proxy.host,
        port: String(proxy.port),
        authenticated: proxy.has_authentication,
        username: '',
        password: '',
        visibility: proxy.visibility,
        user_id: proxy.user_id,
        team_id: proxy.team_id,
        group: proxy.group || '',
    };
}

export default function WorkspaceProxyFormModal({
    isOpen,
    proxy,
    teams,
    groups = [],
    zIndex,
    onClose,
    onSaved,
}: WorkspaceProxyFormModalProps) {
    const [form, setForm] = useState<ProxyForm>(() => initialForm(proxy));
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setForm(initialForm(proxy));
        setError(null);
        setTestResult(null);
    }, [isOpen, proxy]);

    const update = <K extends keyof ProxyForm>(key: K, value: ProxyForm[K]) => {
        setForm(current => ({ ...current, [key]: value }));
        setTestResult(null);
    };

    const testConnection = async () => {
        if (testing || !form.host.trim() || !form.port) return;
        setTesting(true);
        setTestResult(null);
        try {
            const response = await fetch(
                proxy
                    ? `/workspace/proxies/${proxy.id}/test`
                    : '/workspace/proxies/test',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...csrfHeaders(),
                    },
                    body: JSON.stringify({
                        scheme: form.scheme,
                        host: form.host,
                        port: Number(form.port),
                        authenticated: form.authenticated,
                        username: form.username,
                        password: form.password,
                    }),
                },
            );
            const payload = await response.json().catch(() => ({})) as ConnectionTestResult & {
                errors?: Record<string, string[]>;
            };
            if (!response.ok) {
                const validationMessage = payload.errors
                    ? Object.values(payload.errors).flat().find(message => typeof message === 'string')
                    : null;
                throw new Error(validationMessage || payload.message || 'Unable to test this proxy.');
            }
            setTestResult(payload);
        } catch (caught) {
            setTestResult({
                ok: false,
                message: caught instanceof Error ? caught.message : 'Unable to test this proxy.',
            });
        } finally {
            setTesting(false);
        }
    };

    const submit = async () => {
        if (saving) return;
        setSaving(true);
        setError(null);
        try {
            onSaved(await saveProxy(proxy, form));
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Unable to save this proxy.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { if (!saving) onClose(); }}
            title={proxy ? 'Edit proxy' : 'Add proxy'}
            caption="Configure a proxy and choose who can use it in this workspace."
            width="560px"
            zIndex={zIndex}
            modalKind="workspace-proxy-form"
        >
            <S.Form
                onSubmit={event => {
                    event.preventDefault();
                    void submit();
                }}
            >
                <S.FormLayout>
                    <S.Fields $columns={2}>
                        <Input label="Label" value={form.label} onChange={event => update('label', event.target.value)} required />
                        <GroupCombobox value={form.group} onChange={value => update('group', value)} groups={groups} />
                    </S.Fields>
                    <S.Fields $columns={2}>
                        <Select
                            label="Protocol"
                            value={form.scheme}
                            onChange={event => update('scheme', event.target.value as WorkspaceProxy['scheme'])}
                            options={[
                                { value: 'http', label: 'HTTP' },
                                { value: 'https', label: 'HTTPS' },
                                { value: 'socks4', label: 'SOCKS4' },
                                { value: 'socks5', label: 'SOCKS5' },
                            ]}
                        />
                        <Input label="Port" type="number" min={1} max={65535} value={form.port} onChange={event => update('port', event.target.value)} required />
                    </S.Fields>
                    <Input label="Host" value={form.host} onChange={event => update('host', event.target.value)} placeholder="proxy.example.com" required />
                    <Switch
                        id="proxy_requires_authentication"
                        checked={form.authenticated}
                        onChange={value => update('authenticated', value)}
                        label="Proxy requires authentication"
                    />
                    {form.authenticated && (
                        <S.Fields $columns={2}>
                            <Input
                                label="Username"
                                value={form.username}
                                onChange={event => update('username', event.target.value)}
                                hint={proxy ? 'Leave blank to keep the current username.' : undefined}
                                required={!proxy}
                            />
                            <Input
                                label="Password"
                                type="password"
                                value={form.password}
                                onChange={event => update('password', event.target.value)}
                                hint={proxy ? 'Leave blank to keep the current password.' : undefined}
                            />
                        </S.Fields>
                    )}
                    <ScopePicker
                        label="Visibility"
                        value={{ scope: form.visibility, team_id: form.team_id }}
                        teams={teams}
                        ownerLabel="Owner"
                        ownerScope="owner"
                        onChange={value => {
                            update('visibility', value.scope as ProxyForm['visibility']);
                            update('team_id', value.team_id);
                        }}
                    />
                    <UserPicker
                        label="Owner"
                        value={form.user_id}
                        onChange={value => update('user_id', value)}
                        placeholder="Current user"
                    />
                </S.FormLayout>
                {error && <S.Error>{error}</S.Error>}
                {testResult && (
                    <S.ConnectionStatus $success={testResult.ok}>
                        <Icon
                            icon={testResult.ok ? 'lucide:circle-check' : 'lucide:circle-x'}
                            width={15}
                        />
                        <span>
                            <strong>{testResult.message}</strong>
                            {testResult.ok && (
                                <small>
                                    {[
                                        testResult.ip ? `IP ${testResult.ip}` : null,
                                        testResult.latency_ms != null ? `${testResult.latency_ms} ms` : null,
                                    ].filter(Boolean).join(' - ')}
                                </small>
                            )}
                        </span>
                    </S.ConnectionStatus>
                )}
                <S.FormActions>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        loading={testing}
                        disabled={saving || !form.host.trim() || !form.port}
                        onClick={() => { void testConnection(); }}
                    >
                        <Icon icon="lucide:plug-zap" width={14} />
                        Test connection
                    </Button>
                    <S.FormActionsSpacer />
                    <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        size="sm"
                        loading={saving}
                        disabled={testing || !form.label.trim() || !form.host.trim()}
                    >
                        <Icon icon={proxy ? 'lucide:save' : 'lucide:plus'} width={14} />
                        {proxy ? 'Save proxy' : 'Add proxy'}
                    </Button>
                </S.FormActions>
            </S.Form>
        </Modal>
    );
}
