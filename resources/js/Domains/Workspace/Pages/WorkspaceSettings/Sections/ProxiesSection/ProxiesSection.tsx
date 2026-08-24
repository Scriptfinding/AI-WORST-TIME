import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/Shared/UI/Button/Button';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Input, { Select } from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import Switch from '@/Shared/UI/Switch/Switch';
import TableCellContent from '@/Shared/UI/TableCellContent/TableCellContent';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import GroupCombobox from '@/Domains/Variable/Pages/VariableFormModal/GroupCombobox';
import ScopePicker from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
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

interface Props {
    proxies: WorkspaceProxy[];
    teams: { id: Id; name: string }[];
    readOnly?: boolean;
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

function initialCollapsedGroups(): Set<string> {
    try {
        const stored = JSON.parse(localStorage.getItem('workspace-proxies-collapsed-groups') || '[]');
        return new Set(Array.isArray(stored) ? stored.filter(value => typeof value === 'string') : []);
    } catch {
        return new Set();
    }
}

async function requestJson<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...csrfHeaders(),
            ...(options.headers || {}),
        },
    });
    const payload = await response.json().catch(() => ({})) as T & {
        message?: string;
        errors?: Record<string, string[]>;
    };
    if (!response.ok) {
        const validationMessage = payload.errors
            ? Object.values(payload.errors).flat().find(message => typeof message === 'string')
            : null;
        throw new Error(validationMessage || payload.message || 'Proxy request failed.');
    }
    return payload;
}

function endpoint(proxy: WorkspaceProxy): string {
    const host = proxy.host.includes(':') ? `[${proxy.host}]` : proxy.host;
    return `${proxy.scheme}://${host}:${proxy.port}`;
}

function visibilityIcon(proxy: WorkspaceProxy): string {
    if (proxy.visibility === 'team') return 'lucide:users-round';
    if (proxy.visibility === 'workspace') return 'lucide:building-2';
    return 'lucide:user';
}

function visibilityLabel(proxy: WorkspaceProxy): string {
    if (proxy.visibility === 'workspace') return 'Workspace';
    if (proxy.visibility === 'team') return `Team: ${proxy.team?.name || '-'}`;
    return 'Personal';
}

function ProxyActions({
    busy,
    onEdit,
    onDelete,
}: {
    busy: boolean;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useActionMenuDismiss({
        open,
        refs: [menuRef],
        onDismiss: () => setOpen(false),
        closeOnScroll: false,
        eventType: 'mousedown',
        eventCapture: false,
    });

    return (
        <S.Actions>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onEdit}>
                <Icon icon="lucide:pencil" width={14} />
                Edit
            </Button>
            <S.OverflowWrapper ref={menuRef}>
                <S.OverflowButton
                    type="button"
                    disabled={busy}
                    aria-label="Proxy actions"
                    aria-expanded={open}
                    onClick={() => setOpen(current => !current)}
                >
                    <Icon icon={busy ? 'lucide:loader-circle' : 'lucide:more-horizontal'} width={16} />
                </S.OverflowButton>
                {open && (
                    <S.OverflowMenu>
                        <S.DangerMenuItem
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onDelete();
                            }}
                        >
                            <Icon icon="lucide:trash-2" width={14} />
                            Delete
                        </S.DangerMenuItem>
                    </S.OverflowMenu>
                )}
            </S.OverflowWrapper>
        </S.Actions>
    );
}

export default function ProxiesSection({ proxies, teams, readOnly = false }: Props) {
    const [items, setItems] = useState(proxies);
    const [editing, setEditing] = useState<WorkspaceProxy | null>(null);
    const [form, setForm] = useState<ProxyForm>(emptyForm);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [collapsedGroups, setCollapsedGroups] = useState(initialCollapsedGroups);

    const groups = useMemo(
        () => Array.from(new Set(items.map(item => item.group).filter(Boolean) as string[])).sort(),
        [items],
    );
    const groupedItems = useMemo(() => {
        const byGroup = new Map<string | null, WorkspaceProxy[]>();
        for (const item of items) {
            const group = item.group || null;
            const groupItems = byGroup.get(group);
            if (groupItems) groupItems.push(item);
            else byGroup.set(group, [item]);
        }

        return Array.from(byGroup.entries())
            .sort(([a], [b]) => {
                if (a === null) return 1;
                if (b === null) return -1;
                return a.localeCompare(b);
            })
            .map(([group, groupItems]) => ({
                key: group === null ? 'ungrouped' : `group:${group}`,
                label: group ?? 'Ungrouped',
                ungrouped: group === null,
                items: groupItems.sort((a, b) => a.label.localeCompare(b.label)),
            }));
    }, [items]);

    useEffect(() => {
        try {
            localStorage.setItem('workspace-proxies-collapsed-groups', JSON.stringify([...collapsedGroups]));
        } catch {
            // Ignore unavailable browser storage.
        }
    }, [collapsedGroups]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setError(null);
        setOpen(true);
    };

    const openEdit = (proxy: WorkspaceProxy) => {
        setEditing(proxy);
        setForm({
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
        });
        setError(null);
        setOpen(true);
    };

    const update = <K extends keyof ProxyForm>(key: K, value: ProxyForm[K]) => {
        setForm(current => ({ ...current, [key]: value }));
    };

    const submit = async () => {
        if (saving) return;
        setSaving(true);
        setError(null);
        try {
            const url = editing ? `/workspace/proxies/${editing.id}` : '/workspace/proxies';
            const saved = await requestJson<WorkspaceProxy>(url, {
                method: editing ? 'PUT' : 'POST',
                body: JSON.stringify({ ...form, port: Number(form.port) }),
            });
            setItems(current => (
                editing
                    ? current.map(item => item.id === saved.id ? saved : item)
                    : [...current, saved]
            ));
            setOpen(false);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Unable to save this proxy.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (proxy: WorkspaceProxy) => {
        if (!window.confirm(`Delete proxy "${proxy.label}"?`)) return;
        setBusyId(proxy.id);
        setError(null);
        try {
            await requestJson(`/workspace/proxies/${proxy.id}`, { method: 'DELETE' });
            setItems(current => current.filter(item => item.id !== proxy.id));
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Unable to delete this proxy.');
        } finally {
            setBusyId(null);
        }
    };

    const toggleGroup = (group: string) => {
        setCollapsedGroups(current => {
            const next = new Set(current);
            if (next.has(group)) next.delete(group);
            else next.add(group);
            return next;
        });
    };

    return (
        <S.Rows>
            <S.Card>
                <S.CardHeader>
                    <S.CardTitle>
                        <Icon icon="lucide:network" width={15} height={15} />
                        Proxy servers
                    </S.CardTitle>
                    {!readOnly && (
                        <Button size="sm" onClick={openCreate}>
                            <Icon icon="lucide:plus" width={14} />
                            <S.AddButtonLabel>Add proxy</S.AddButtonLabel>
                        </Button>
                    )}
                </S.CardHeader>
                <S.SectionHint>
                    Configure and organize the proxy servers available to flows in this workspace.
                </S.SectionHint>
                {error && !open && <S.Error>{error}</S.Error>}
                {items.length === 0 ? (
                    <S.EmptyState>No proxy servers configured.</S.EmptyState>
                ) : (
                    <S.TableWrapper>
                        <S.Table>
                            <thead>
                                <tr>
                                    <th>Proxy</th>
                                    <th>Endpoint</th>
                                    <th>Protocol</th>
                                    <th>Authentication</th>
                                    <th>Visibility</th>
                                    <th>Owner</th>
                                    <th aria-label="Actions" />
                                </tr>
                            </thead>
                            <tbody>
                                {groupedItems.map(({ key, label, ungrouped, items: groupProxies }) => (
                                    <Fragment key={key}>
                                        <S.GroupRow>
                                            <td colSpan={7}>
                                                <TableCellContent>
                                                    <S.GroupButton
                                                        type="button"
                                                        aria-expanded={!collapsedGroups.has(key)}
                                                        onClick={() => toggleGroup(key)}
                                                    >
                                                        <Icon icon={collapsedGroups.has(key) ? 'lucide:chevron-right' : 'lucide:chevron-down'} width={13} />
                                                        <Icon icon={ungrouped ? 'lucide:inbox' : 'lucide:folder'} width={13} />
                                                        {label}
                                                        <S.GroupCount>{groupProxies.length}</S.GroupCount>
                                                    </S.GroupButton>
                                                </TableCellContent>
                                            </td>
                                        </S.GroupRow>
                                        {!collapsedGroups.has(key) && groupProxies.map(proxy => (
                                            <S.Row key={proxy.id}>
                                                <td><TableCellContent><S.ProxyName>{proxy.label}</S.ProxyName></TableCellContent></td>
                                                <td><TableCellContent><S.Endpoint>{endpoint(proxy)}</S.Endpoint></TableCellContent></td>
                                                <td>
                                                    <TableCellContent>
                                                        <S.InlineCell>
                                                            <Icon icon="lucide:globe-2" width={13} />
                                                            {proxy.scheme.toUpperCase()}
                                                        </S.InlineCell>
                                                    </TableCellContent>
                                                </td>
                                                <td>
                                                    <TableCellContent>
                                                        {proxy.has_authentication
                                                            ? (
                                                                <S.InlineCell>
                                                                    <Icon icon="lucide:key-round" width={13} />
                                                                    Credentials
                                                                </S.InlineCell>
                                                            )
                                                            : <S.Muted>None</S.Muted>}
                                                    </TableCellContent>
                                                </td>
                                                <td>
                                                    <TableCellContent>
                                                        <S.ScopeBadge $scope={proxy.visibility}>
                                                            <Icon icon={visibilityIcon(proxy)} width={10} />
                                                            {visibilityLabel(proxy)}
                                                        </S.ScopeBadge>
                                                    </TableCellContent>
                                                </td>
                                                <td><TableCellContent><S.OwnerName>{proxy.owner?.name || '-'}</S.OwnerName></TableCellContent></td>
                                                <td>
                                                    <TableCellContent $align="end">
                                                        {!readOnly && (
                                                            <ProxyActions
                                                                busy={busyId === proxy.id}
                                                                onEdit={() => openEdit(proxy)}
                                                                onDelete={() => { void remove(proxy); }}
                                                            />
                                                        )}
                                                    </TableCellContent>
                                                </td>
                                            </S.Row>
                                        ))}
                                    </Fragment>
                                ))}
                            </tbody>
                        </S.Table>
                    </S.TableWrapper>
                )}
            </S.Card>

            <Modal
                isOpen={open}
                onClose={() => { if (!saving) setOpen(false); }}
                title={editing ? 'Edit proxy' : 'Add proxy'}
                caption="Configure a proxy and choose who can use it in this workspace."
                width="560px"
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
                                    hint={editing ? 'Leave blank to keep the current username.' : undefined}
                                    required={!editing}
                                />
                                <Input
                                    label="Password"
                                    type="password"
                                    value={form.password}
                                    onChange={event => update('password', event.target.value)}
                                    hint={editing ? 'Leave blank to keep the current password.' : undefined}
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
                    <S.FormActions>
                        <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" loading={saving} disabled={!form.label.trim() || !form.host.trim()}>
                            <Icon icon={editing ? 'lucide:save' : 'lucide:plus'} width={14} />
                            {editing ? 'Save proxy' : 'Add proxy'}
                        </Button>
                    </S.FormActions>
                </S.Form>
            </Modal>
        </S.Rows>
    );
}
