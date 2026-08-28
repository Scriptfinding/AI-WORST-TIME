import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '@/Shared/UI/Button/Button';
import { Icon } from '@/Shared/UI/Icon/Icon';
import TableCellContent from '@/Shared/UI/TableCellContent/TableCellContent';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
import { useAnchoredDropdownPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/hooks/useAnchoredDropdownPosition';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import LocalTableFilterToolbar from '@/Shared/UI/TableFilters/LocalTableFilterToolbar';
import { matchesOwnershipScope } from '@/Shared/UI/TableFilters/options';
import type { WorkspaceProxy } from '@/Domains/Workspace/types';
import WorkspaceProxyFormModal from './WorkspaceProxyFormModal';
import * as S from './styled';

interface Props {
    proxies: WorkspaceProxy[];
    teams: { id: Id; name: string }[];
    readOnly?: boolean;
}

function initialCollapsedGroups(): Set<string> {
    try {
        const stored = JSON.parse(localStorage.getItem('workspace-proxies-collapsed-groups') || '[]');
        return new Set(Array.isArray(stored) ? stored.filter(value => typeof value === 'string') : []);
    } catch {
        return new Set();
    }
}

async function requestJson(url: string, options: RequestInit): Promise<void> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...csrfHeaders(),
            ...(options.headers || {}),
        },
    });
    const payload = await response.json().catch(() => ({})) as {
        message?: string;
        errors?: Record<string, string[]>;
    };
    if (!response.ok) {
        const validationMessage = payload.errors
            ? Object.values(payload.errors).flat().find(message => typeof message === 'string')
            : null;
        throw new Error(validationMessage || payload.message || 'Proxy request failed.');
    }
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
    const triggerRef = useRef<HTMLButtonElement>(null);
    const { dropdownRect, updateDropdownPosition } = useAnchoredDropdownPosition(
        triggerRef,
        open,
        {
            maxHeight: 160,
            minHeight: 44,
            minWidth: 150,
            clampLeft: true,
        },
    );

    useActionMenuDismiss({
        open,
        refs: [triggerRef, menuRef],
        onDismiss: () => setOpen(false),
        closeOnScroll: false,
        eventType: 'mousedown',
        eventCapture: false,
    });

    return (
        <S.Actions>
            <S.OverflowWrapper>
                <S.OverflowButton
                    type="button"
                    ref={triggerRef}
                    disabled={busy}
                    aria-label="Proxy actions"
                    aria-expanded={open}
                    onClick={() => {
                        if (!open) updateDropdownPosition();
                        setOpen(current => !current);
                    }}
                >
                    <Icon icon={busy ? 'lucide:loader-circle' : 'lucide:more-horizontal'} width={16} />
                </S.OverflowButton>
                {open && dropdownRect && createPortal(
                    <S.OverflowMenu
                        ref={menuRef}
                        style={{
                            top: dropdownRect.top,
                            left: dropdownRect.left,
                            width: dropdownRect.width,
                            transform: dropdownRect.placement === 'above'
                                ? 'translateY(-100%)'
                                : undefined,
                        }}
                    >
                        <S.MenuItem
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                onEdit();
                            }}
                        >
                            <Icon icon="lucide:pencil" width={14} />
                            Edit
                        </S.MenuItem>
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
                    </S.OverflowMenu>,
                    document.body,
                )}
            </S.OverflowWrapper>
        </S.Actions>
    );
}

export default function ProxiesSection({ proxies, teams, readOnly = false }: Props) {
    const [items, setItems] = useState(proxies);
    const [editing, setEditing] = useState<WorkspaceProxy | null>(null);
    const [open, setOpen] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [collapsedGroups, setCollapsedGroups] = useState(initialCollapsedGroups);
    const [search, setSearch] = useState('');
    const [scope, setScope] = useState<string | null>(null);

    const groups = useMemo(
        () => Array.from(new Set(items.map(item => item.group).filter(Boolean) as string[])).sort(),
        [items],
    );
    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase();

        return items.filter(item => {
            if (!matchesOwnershipScope(item, scope)) return false;
            if (!query) return true;

            return [
                item.label,
                item.host,
                String(item.port),
                item.scheme,
                item.group,
                item.owner?.name,
                item.team?.name,
            ].some(value => value?.toLowerCase().includes(query));
        });
    }, [items, scope, search]);
    const groupedItems = useMemo(() => {
        const byGroup = new Map<string | null, WorkspaceProxy[]>();
        for (const item of filteredItems) {
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
    }, [filteredItems]);

    useEffect(() => {
        try {
            localStorage.setItem('workspace-proxies-collapsed-groups', JSON.stringify([...collapsedGroups]));
        } catch {
            // Ignore unavailable browser storage.
        }
    }, [collapsedGroups]);

    const openCreate = () => {
        setEditing(null);
        setError(null);
        setOpen(true);
    };

    const openEdit = (proxy: WorkspaceProxy) => {
        setEditing(proxy);
        setError(null);
        setOpen(true);
    };

    const handleSaved = (saved: WorkspaceProxy) => {
        setItems(current => (
            editing
                ? current.map(item => item.id === saved.id ? saved : item)
                : [...current, saved]
        ));
        setOpen(false);
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
                <LocalTableFilterToolbar
                    search={search}
                    scope={scope}
                    teams={teams}
                    searchPlaceholder="Search proxies..."
                    personalScopeLabel="Personal proxies"
                    onSearchChange={setSearch}
                    onScopeChange={setScope}
                />
                {error && !open && <S.Error>{error}</S.Error>}
                {filteredItems.length === 0 ? (
                    <S.EmptyState>
                        {items.length === 0
                            ? 'No proxy servers configured.'
                            : 'No proxy servers match these filters.'}
                    </S.EmptyState>
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

            <WorkspaceProxyFormModal
                isOpen={open}
                proxy={editing}
                teams={teams}
                groups={groups}
                onClose={() => setOpen(false)}
                onSaved={handleSaved}
            />
        </S.Rows>
    );
}
