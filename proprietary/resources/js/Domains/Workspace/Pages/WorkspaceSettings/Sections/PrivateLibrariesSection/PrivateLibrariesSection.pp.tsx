import { createElement, useEffect, useMemo, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
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
    const [showAddModal, setShowAddModal] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState(initialCollapsedGroups);

    const groups = useMemo(
        () => Array.from(new Set(items.map(item => item.group).filter(Boolean) as string[])).sort(),
        [items],
    );

    const groupedItems = useMemo(() => {
        const byGroup = items.reduce<Record<string, PrivateLibrary[]>>((acc, item) => {
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
    }, [items]);

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

    const closeAddModal = () => {
        if (saving) return;
        setShowAddModal(false);
        setForm(emptyForm);
        setError(null);
    };

    const submit = async () => {
        if (readOnly || saving) return;

        setSaving(true);
        setError(null);
        try {
            const library = await requestJson<PrivateLibrary>('/workspace/private-libraries', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    team_id: form.visibility === 'team' ? form.team_id : null,
                    group: form.group || null,
                }),
            });
            setItems(current => [...current, library].sort((a, b) => a.label.localeCompare(b.label)));
            setForm(emptyForm);
            setShowAddModal(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to add this private library.');
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
                            <Button type="button" size="sm" onClick={() => { setError(null); setShowAddModal(true); }}>
                                <Icon icon="lucide:plus" width={14} />
                                <S.AddButtonLabel>Add private library</S.AddButtonLabel>
                            </Button>
                        )}
                    </S.CardHeader>
                    <S.SectionHint>
                        Add GitHub repositories that follow the Puppetflow library structure. The repository is downloaded into cache when it is added, then refreshed only when you click Refresh.
                    </S.SectionHint>
                    {error && !showAddModal && <S.ErrorBox>{error}</S.ErrorBox>}
                    {items.length === 0 ? (
                        <S.EmptyState>No private libraries configured.</S.EmptyState>
                    ) : (
                        <PrivateLibrariesTable
                            groups={groupedItems}
                            collapsedGroups={collapsedGroups}
                            busyId={busyId}
                            readOnly={readOnly}
                            onToggleGroup={toggleGroup}
                            onRefresh={refresh}
                            onDelete={library => { void requestDelete(library); }}
                        />
                    )}
                </S.Card>
            </S.Rows>

            <PrivateLibraryForm
                isOpen={showAddModal}
                values={form}
                groups={groups}
                teams={teams}
                saving={saving}
                error={error}
                onClose={closeAddModal}
                onChange={updateForm}
                onSubmit={() => { void submit(); }}
            />
            <ConfirmModal />
        </>
    );
}
