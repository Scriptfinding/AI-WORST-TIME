import { createElement, useEffect, useMemo, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import LocalTableFilterToolbar from '@/Shared/UI/TableFilters/LocalTableFilterToolbar';
import { matchesOwnershipScope } from '@/Shared/UI/TableFilters/options';
import DeletePrivateLibraryMessage from './DeletePrivateLibraryMessage.pp';
import PrivateLibraryForm from './PrivateLibraryForm.pp';
import PrivateLibrariesTable from './PrivateLibrariesTable.pp';
import type { PrivateLibrary, PrivateLibraryFormValues, TeamOption } from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/types.pp';
import { requestJson } from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/utils.pp';
import * as S from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/styled.pp';

export type { PrivateLibrary } from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/types.pp';

interface Props {
    libraries: PrivateLibrary[];
    teams: TeamOption[];
    readOnly?: boolean;
}

const emptyForm: PrivateLibraryFormValues = {
    label: '',
    url: '',
    branch: 'main',
    visibility: 'owner',
    user_id: null,
    team_id: null,
    group: '',
};

function initialCollapsedGroups() {
    try {
        return new Set<string>(JSON.parse(localStorage.getItem('private-libraries-collapsed-groups') || '[]'));
    } catch {
        return new Set<string>();
    }
}

export default function PrivateLibrariesSection({ libraries, teams, readOnly = false }: Props) {
    const { confirm, ConfirmModal } = useConfirm();
    const [items, setItems] = useState(libraries);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editing, setEditing] = useState<PrivateLibrary | null>(null);
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
                item.description,
                item.repo,
                item.url,
                item.branch,
                item.group,
                item.owner?.name,
                item.team?.name,
            ].some(value => value?.toLowerCase().includes(query));
        });
    }, [items, scope, search]);

    const groupedItems = useMemo(() => {
        const byGroup = filteredItems.reduce<Record<string, PrivateLibrary[]>>((acc, item) => {
            const key = item.group || 'Ungrouped';
            (acc[key] ??= []).push(item);
            return acc;
        }, {});

        return Object.entries(byGroup)
            .sort(([a], [b]) => {
                if (a === 'Ungrouped') return 1;
                if (b === 'Ungrouped') return -1;
                return a.localeCompare(b);
            })
            .map(([group, groupItems]) => ({
                group,
                items: groupItems.sort((a, b) => a.label.localeCompare(b.label)),
            }));
    }, [filteredItems]);

    useEffect(() => {
        try {
            localStorage.setItem('private-libraries-collapsed-groups', JSON.stringify([...collapsedGroups]));
        } catch {
            // Ignore unavailable browser storage.
        }
    }, [collapsedGroups]);

    const toggleGroup = (group: string) => {
        setCollapsedGroups(current => {
            const next = new Set(current);
            if (next.has(group)) next.delete(group);
            else next.add(group);
            return next;
        });
    };

    const updateForm = <K extends keyof PrivateLibraryFormValues>(
        key: K,
        value: PrivateLibraryFormValues[K],
    ) => {
        setForm(current => ({ ...current, [key]: value }));
    };

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setError(null);
        setShowFormModal(true);
    };

    const openEdit = (library: PrivateLibrary) => {
        setEditing(library);
        setForm({
            label: library.label,
            url: library.url,
            branch: library.branch || 'main',
            visibility: library.visibility,
            user_id: library.user_id,
            team_id: library.team_id,
            group: library.group || '',
        });
        setError(null);
        setShowFormModal(true);
    };

    const closeFormModal = () => {
        if (saving) return;
        setShowFormModal(false);
        setEditing(null);
        setForm(emptyForm);
        setError(null);
    };

    const submit = async () => {
        if (readOnly || saving) return;

        setSaving(true);
        setError(null);
        try {
            const library = await requestJson<PrivateLibrary>(
                editing
                    ? `/workspace/private-libraries/${editing.id}`
                    : '/workspace/private-libraries',
                {
                    method: editing ? 'PUT' : 'POST',
                    body: JSON.stringify({
                        ...form,
                        team_id: form.visibility === 'team' ? form.team_id : null,
                        group: form.group || null,
                    }),
                },
            );
            setItems(current => (
                editing
                    ? current.map(item => item.id === library.id ? library : item)
                    : [...current, library]
            ).sort((a, b) => a.label.localeCompare(b.label)));
            setEditing(null);
            setForm(emptyForm);
            setShowFormModal(false);
        } catch (err) {
            setError(err instanceof Error
                ? err.message
                : `Unable to ${editing ? 'update' : 'add'} this private library.`);
        } finally {
            setSaving(false);
        }
    };

    const refresh = async (library: PrivateLibrary) => {
        setBusyId(library.id);
        setError(null);
        try {
            const refreshed = await requestJson<PrivateLibrary>(
                `/workspace/private-libraries/${library.id}/refresh`,
                { method: 'POST' },
            );
            setItems(current => current.map(item => item.id === library.id ? refreshed : item));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to refresh this private library.');
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (library: PrivateLibrary, deleteImports: boolean) => {
        setBusyId(library.id);
        setError(null);
        try {
            await requestJson(`/workspace/private-libraries/${library.id}`, {
                method: 'DELETE',
                body: JSON.stringify({ delete_imports: deleteImports }),
            });
            setItems(current => current.filter(item => item.id !== library.id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to delete this private library.');
        } finally {
            setBusyId(null);
        }
    };

    const requestDelete = async (library: PrivateLibrary) => {
        const deleteImportsRef = { current: false };
        const confirmed = await confirm({
            title: 'Delete private library',
            message: createElement(DeletePrivateLibraryMessage, {
                onDeleteImportsChange: value => { deleteImportsRef.current = value; },
            }),
            confirmLabel: 'Delete library',
            variant: 'danger',
        });

        if (confirmed) await remove(library, deleteImportsRef.current);
    };

    return (
        <>
            <S.Rows>
                <S.Card>
                    <S.CardHeader>
                        <S.CardTitle>
                            <Icon icon="lucide:library" width={15} height={15} />
                            Configured Libraries
                        </S.CardTitle>
                        {!readOnly && (
                            <Button type="button" size="sm" onClick={openCreate}>
                                <Icon icon="lucide:plus" width={14} />
                                <S.AddButtonLabel>Add private library</S.AddButtonLabel>
                            </Button>
                        )}
                    </S.CardHeader>
                    <S.SectionHint>
                        Add GitHub repositories that follow the Puppetflow library structure. The repository is downloaded into cache when it is added, then refreshed only when you click Refresh.
                    </S.SectionHint>
                    <LocalTableFilterToolbar
                        search={search}
                        scope={scope}
                        teams={teams}
                        searchPlaceholder="Search libraries..."
                        personalScopeLabel="Personal libraries"
                        onSearchChange={setSearch}
                        onScopeChange={setScope}
                    />
                    {error && !showFormModal && <S.ErrorBox>{error}</S.ErrorBox>}
                    {filteredItems.length === 0 ? (
                        <S.EmptyState>
                            {items.length === 0
                                ? 'No private libraries configured.'
                                : 'No private libraries match these filters.'}
                        </S.EmptyState>
                    ) : (
                        <PrivateLibrariesTable
                            groups={groupedItems}
                            collapsedGroups={collapsedGroups}
                            busyId={busyId}
                            readOnly={readOnly}
                            onToggleGroup={toggleGroup}
                            onEdit={openEdit}
                            onRefresh={refresh}
                            onDelete={library => { void requestDelete(library); }}
                        />
                    )}
                </S.Card>
            </S.Rows>

            <PrivateLibraryForm
                isOpen={showFormModal}
                editing={editing !== null}
                values={form}
                groups={groups}
                teams={teams}
                saving={saving}
                error={error}
                onClose={closeFormModal}
                onChange={updateForm}
                onSubmit={() => { void submit(); }}
            />
            <ConfirmModal />
        </>
    );
}
