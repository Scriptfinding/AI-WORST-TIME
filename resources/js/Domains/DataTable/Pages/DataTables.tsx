import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import { useAuth } from '@/App/Hooks/usePageProps';
import Button from '@/Shared/UI/Button/Button';
import BulkDeleteConfirmation from '@/Shared/UI/BulkDeleteConfirmation/BulkDeleteConfirmation';
import AvatarSelectionToggle from '@/Shared/UI/AvatarSelectionToggle/AvatarSelectionToggle';
import SelectAllVisible from '@/Shared/UI/TableFilters/SelectAllVisible';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { matchesOwnershipScope } from '@/Shared/UI/TableFilters/options';
import { useCollapsedGroups } from '@/Shared/UI/TableFilters/useCollapsedGroups';
import { groupHierarchicalItems } from '@/Shared/Utils/groupHierarchicalItems';
import * as FilterToolbarS from '@/Shared/UI/TableFilters/LocalTableFilterToolbar.styled';
import { invalidateDataTableCache } from '@/Domains/Flow/Pages/FlowEditor/utils/dataTableSuggestions';
import { dataTableApi, DataTableApiError } from '../api';
import type {
    DataTable,
    DataTableData,
    DataTableFilter,
    DataTablePayload,
    DataTableSort,
    DataTablesPageProps,
} from '../types';
import DataGrid from './DataGrid';
import DataTableModal from './DataTableModal';
import * as S from './styled';

const DEFAULT_PAGE_LIMIT = 50;
const PAGE_LIMIT_OPTIONS = [20, 50, 100];

const paginationParam = (name: 'page' | 'limit', fallback: number) => {
    if (typeof window === 'undefined') return fallback;
    const value = Number(new URL(window.location.href).searchParams.get(name));
    if (!Number.isInteger(value) || value < 1) return fallback;
    if (name === 'limit' && !PAGE_LIMIT_OPTIONS.includes(value)) return fallback;
    return value;
};

const scopeIcon = (scope: DataTable['visibility']) => (
    scope === 'workspace'
        ? 'lucide:building-2'
        : scope === 'team' ? 'lucide:users-round' : 'lucide:user'
);

export default function DataTables({
    dataTables: initialDataTables,
    teams = [],
    isAdmin: isAdminProp,
    selectedDataTableId = null,
    tableData: initialTableData = null,
}: DataTablesPageProps) {
    const { user } = useAuth();
    const collapsedGroups = useCollapsedGroups(
        `data-table-collapsed-groups:${user?.id ?? 'anonymous'}`,
    );
    const isAdmin = isAdminProp ?? user?.workspace_role === 'admin';
    const { confirm, ConfirmModal } = useConfirm();
    const [dataTables, setDataTables] = useState(initialDataTables);
    const [activeTableId, setActiveTableId] = useState<Id | null>(
        selectedDataTableId ?? initialTableData?.table.id ?? initialDataTables[0]?.id ?? null,
    );
    const [tableData, setTableData] = useState<DataTableData | null>(initialTableData);
    const [search, setSearch] = useState('');
    const [scope, setScope] = useState<string | null>(null);
    const [sortAscending, setSortAscending] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<Id>>(() => new Set());
    const [mobilePane, setMobilePane] = useState<'tables' | 'data'>('tables');
    const [loadingData, setLoadingData] = useState(false);
    const [deletingSelected, setDeletingSelected] = useState(false);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<DataTable | null>(null);
    const [modalSubmitting, setModalSubmitting] = useState(false);
    const [modalError, setModalError] = useState('');
    const [pageLimit, setPageLimit] = useState(() => paginationParam('limit', DEFAULT_PAGE_LIMIT));
    const initialPage = useRef(paginationParam('page', 1));
    const initialized = useRef(false);

    const activeTable = dataTables.find(table => table.id === activeTableId) ?? null;
    const canManage = (table: DataTable) => (
        table.can_manage || isAdmin || table.user_id === user?.id
    );
    const messageFor = (caught: unknown) => (
        caught instanceof DataTableApiError ? caught.message : 'The request could not be completed.'
    );

    const filteredTables = useMemo(() => {
        const query = search.trim().toLowerCase();
        let result = dataTables.filter(table => matchesOwnershipScope(table, scope));
        if (query) {
            result = result.filter(table => (
                table.name.toLowerCase().includes(query)
                || table.description?.toLowerCase().includes(query)
                || table.group?.toLowerCase().includes(query)
                || table.user_name?.toLowerCase().includes(query)
                || table.team_name?.toLowerCase().includes(query)
            ));
        }
        return [...result].sort((first, second) => {
            const comparison = first.name.localeCompare(second.name);
            return sortAscending ? comparison : -comparison;
        });
    }, [dataTables, scope, search, sortAscending]);
    const groupedSections = useMemo(() => groupHierarchicalItems(
        [...filteredTables].sort((first, second) => (
            (first.group ?? '\uffff').localeCompare(second.group ?? '\uffff')
        )),
        table => table.group,
    ), [filteredTables]);
    const groups = useMemo(() => (
        [...new Set(dataTables.map(table => table.group).filter((group): group is string => !!group))].sort()
    ), [dataTables]);

    const manageableFilteredTables = filteredTables.filter(canManage);
    const allFilteredSelected = manageableFilteredTables.length > 0
        && manageableFilteredTables.every(table => selectedIds.has(table.id));

    useEffect(() => {
        const availableIds = new Set(dataTables.map(table => table.id));
        setSelectedIds(current => {
            const next = new Set([...current].filter(id => availableIds.has(id)));
            return next.size === current.size ? current : next;
        });
    }, [dataTables]);

    const syncSelectionUrl = (
        tableId: Id | null,
        page: number | null = null,
        limit: number | null = null,
    ) => {
        const url = new URL(window.location.href);
        if (tableId === null) url.searchParams.delete('t');
        else url.searchParams.set('t', String(tableId));
        if (page === null) url.searchParams.delete('page');
        else url.searchParams.set('page', String(page));
        if (limit === null) url.searchParams.delete('limit');
        else url.searchParams.set('limit', String(limit));
        url.searchParams.delete('d');
        window.history.replaceState(window.history.state, '', url);
    };

    const loadTable = async (
        tableId: Id,
        page = 1,
        filters: DataTableFilter[] = [],
        limit = pageLimit,
        sort: DataTableSort | null = { column: 'id', direction: 'asc' },
    ) => {
        setActiveTableId(tableId);
        setMobilePane('data');
        setPageLimit(limit);
        syncSelectionUrl(tableId, page, limit);
        setLoadingData(true);
        setError('');
        try {
            const data = await dataTableApi.getTable(tableId, page, filters, limit, sort);
            setTableData(data);
            setDataTables(current => current.map(table => (
                table.id === data.table.id ? { ...table, ...data.table } : table
            )));
        } catch (caught) {
            setTableData(null);
            setError(messageFor(caught));
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        if (!activeTableId) return;
        if (initialTableData?.table.id === activeTableId) {
            setPageLimit(initialTableData.rows.per_page);
            syncSelectionUrl(
                activeTableId,
                initialTableData.rows.current_page,
                initialTableData.rows.per_page,
            );
            return;
        }
        void loadTable(activeTableId, initialPage.current, [], pageLimit);
        // Initialization intentionally uses the first loadTable closure once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTableId, initialTableData, pageLimit]);

    const openCreate = () => {
        setEditingTable(null);
        setModalError('');
        setModalOpen(true);
    };

    const openEdit = (table: DataTable) => {
        setEditingTable(table);
        setModalError('');
        setModalOpen(true);
    };

    const saveTable = async (payload: DataTablePayload) => {
        setModalSubmitting(true);
        setModalError('');
        try {
            if (editingTable) {
                const updated = await dataTableApi.updateTable(editingTable.id, payload);
                setDataTables(current => current.map(table => (
                    table.id === updated.id ? updated : table
                )));
                setTableData(current => current?.table.id === updated.id
                    ? { ...current, table: updated }
                    : current);
            } else {
                const created = await dataTableApi.createTable(payload);
                setDataTables(current => [...current, created]);
                await loadTable(created.id);
            }
            invalidateDataTableCache();
            setModalOpen(false);
        } catch (caught) {
            setModalError(messageFor(caught));
        } finally {
            setModalSubmitting(false);
        }
    };

    const removeTables = async (tables: DataTable[]) => {
        if (tables.length === 0) return;
        const confirmed = await confirm({
            title: tables.length === 1 ? 'Delete Data Table' : 'Delete Data Tables',
            message: tables.length === 1 ? (
                `Delete "${tables[0].name}" and all of its rows and columns?`
            ) : (
                <BulkDeleteConfirmation
                    description="All rows and columns stored in these data tables will also be permanently deleted."
                    items={tables.map(table => ({
                        id: table.id,
                        title: table.name,
                        subtitle: `${table.rows_count} row${table.rows_count === 1 ? '' : 's'}, ${table.columns_count} column${table.columns_count === 1 ? '' : 's'}`,
                        icon: <Icon icon="lucide:table" width={22} height={22} />,
                    }))}
                />
            ),
            confirmLabel: tables.length === 1 ? 'Delete Data Table' : `Delete (${tables.length})`,
            variant: 'danger',
        });
        if (!confirmed) return;

        setDeletingSelected(tables.length > 1);
        setError('');
        try {
            if (tables.length === 1) await dataTableApi.deleteTable(tables[0].id);
            else await dataTableApi.deleteTables(tables.map(table => table.id));
            invalidateDataTableCache();
            const removedIds = new Set(tables.map(table => table.id));
            const remaining = dataTables.filter(table => !removedIds.has(table.id));
            setDataTables(remaining);
            setSelectedIds(new Set());
            if (activeTableId !== null && removedIds.has(activeTableId)) {
                setActiveTableId(null);
                setTableData(null);
                syncSelectionUrl(null);
                if (remaining[0]) await loadTable(remaining[0].id);
                else setMobilePane('tables');
            }
        } catch (caught) {
            setError(messageFor(caught));
        } finally {
            setDeletingSelected(false);
        }
    };

    const toggleSelection = (tableId: Id) => {
        setSelectedIds(current => {
            const next = new Set(current);
            if (next.has(tableId)) next.delete(tableId);
            else next.add(tableId);
            return next;
        });
    };

    const toggleAllFiltered = () => {
        setSelectedIds(current => {
            const next = new Set(current);
            manageableFilteredTables.forEach(table => {
                if (allFilteredSelected) next.delete(table.id);
                else next.add(table.id);
            });
            return next;
        });
    };

    const syncCounts = (counts: { rows_count?: number; columns_count?: number }) => {
        if (activeTableId === null) return;
        setDataTables(current => current.map(table => (
            table.id === activeTableId ? { ...table, ...counts } : table
        )));
        setTableData(current => current ? {
            ...current,
            table: { ...current.table, ...counts },
        } : current);
    };

    const syncColumns = (columns: DataTableData['columns']) => {
        setTableData(current => current ? { ...current, columns } : current);
    };

    const selectedTables = dataTables.filter(table => selectedIds.has(table.id));

    return (
        <AppLayout
            title="Data Tables"
            noPadding
            headerRight={(
                <S.HeaderActions>
                    {selectedIds.size > 0 && (
                        <Button
                            size="sm"
                            variant="danger"
                            loading={deletingSelected}
                            onClick={() => void removeTables(selectedTables)}
                        >
                            <Icon icon="lucide:trash-2" width={14} />
                            Delete ({selectedIds.size})
                        </Button>
                    )}
                    <Button size="sm" onClick={openCreate}>
                        <Icon icon="lucide:plus" width={14} />
                        New Data Table
                    </Button>
                </S.HeaderActions>
            )}
        >
            <S.Page>
                {error && <S.ErrorBanner role="alert">{error}</S.ErrorBanner>}
                <S.MobileNav aria-label="Data table panes">
                    {(['tables', 'data'] as const).map(pane => (
                        <S.MobileNavButton
                            key={pane}
                            type="button"
                            $active={mobilePane === pane}
                            onClick={() => setMobilePane(pane)}
                        >
                            {pane === 'tables' ? 'Data Tables' : 'Data'}
                        </S.MobileNavButton>
                    ))}
                </S.MobileNav>
                <S.Container>
                    <S.Panel $width="340px" $mobileVisible={mobilePane === 'tables'}>
                        <S.PanelHeader>
                            <S.PanelContextTitle>Data Tables</S.PanelContextTitle>
                            <S.PanelContextCount>
                                {filteredTables.length} / {dataTables.length}
                            </S.PanelContextCount>
                        </S.PanelHeader>
                        <S.PanelFilterToolbar
                            compact
                            search={search}
                            scope={scope}
                            teams={teams}
                            searchPlaceholder="Search data tables..."
                            personalScopeLabel="My data tables"
                            trailing={(
                                <FilterToolbarS.SortButton
                                    type="button"
                                    onClick={() => setSortAscending(value => !value)}
                                    title={sortAscending ? 'Z to A' : 'A to Z'}
                                >
                                    <Icon
                                        icon={sortAscending
                                            ? 'lucide:arrow-up-z-a'
                                            : 'lucide:arrow-down-a-z'}
                                        width={14}
                                    />
                                </FilterToolbarS.SortButton>
                            )}
                            onSearchChange={setSearch}
                            onScopeChange={setScope}
                        />
                        {manageableFilteredTables.length > 0 && (
                            <SelectAllVisible
                                allSelected={allFilteredSelected}
                                itemLabel="data tables"
                                onToggle={toggleAllFiltered}
                            />
                        )}
                        <S.List>
                            {groupedSections.map(section => {
                                const hideItems = section.group
                                    ? collapsedGroups.isGroupHidden(section.group)
                                    : false;
                                const visibleHeaders = section.headers.filter(header => {
                                    const parentKey = header.key.split('/').slice(0, -1).join('/');
                                    return !parentKey || !collapsedGroups.isGroupHidden(parentKey);
                                });
                                if (hideItems && visibleHeaders.length === 0) return null;
                                const itemDepth = section.group ? section.group.split('/').length : 0;

                                return (
                                    <Fragment key={section.group ?? 'ungrouped'}>
                                        {visibleHeaders.map(header => (
                                            <S.FolderLabel
                                                key={header.key}
                                                type="button"
                                                $depth={header.depth}
                                                onClick={() => collapsedGroups.toggleGroup(header.key)}
                                            >
                                                <Icon
                                                    icon={collapsedGroups.collapsedGroups.has(header.key)
                                                        ? 'lucide:chevron-right'
                                                        : 'lucide:chevron-down'}
                                                    width={11}
                                                />
                                                <Icon icon="lucide:folder" width={10} />
                                                <span>{header.label}</span>
                                                <S.GroupCount>({header.count})</S.GroupCount>
                                            </S.FolderLabel>
                                        ))}
                                        {!hideItems && section.items.map(table => (
                                <S.TableListRow
                                    key={table.id}
                                    role="button"
                                    tabIndex={0}
                                    $active={table.id === activeTableId}
                                    $depth={itemDepth}
                                    onClick={() => void loadTable(table.id)}
                                    onKeyDown={event => {
                                        if (event.target !== event.currentTarget) return;
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            void loadTable(table.id);
                                        }
                                    }}
                                >
                                    {canManage(table) ? (
                                        <AvatarSelectionToggle
                                            selected={selectedIds.has(table.id)}
                                            onChange={() => toggleSelection(table.id)}
                                            label={`${selectedIds.has(table.id) ? 'Deselect' : 'Select'} ${table.name}`}
                                            size={22}
                                        >
                                            <S.ScopeIcon $scope={table.visibility} title={table.visibility}>
                                                <Icon icon={scopeIcon(table.visibility)} width={12} />
                                            </S.ScopeIcon>
                                        </AvatarSelectionToggle>
                                    ) : (
                                        <S.ScopeIcon $scope={table.visibility} title={table.visibility}>
                                            <Icon icon={scopeIcon(table.visibility)} width={12} />
                                        </S.ScopeIcon>
                                    )}
                                    <S.RowContent>
                                        <S.RowName>{table.name}</S.RowName>
                                        <S.RowMeta>
                                            {table.rows_count} row{table.rows_count === 1 ? '' : 's'},{' '}
                                            {table.columns_count} column{table.columns_count === 1 ? '' : 's'}
                                            {', '}
                                            {table.visibility === 'team'
                                                ? table.team_name || 'Team'
                                                : table.visibility === 'workspace'
                                                    ? 'Workspace'
                                                    : table.user_id === user?.id ? 'You' : table.user_name || 'Owner'}
                                        </S.RowMeta>
                                    </S.RowContent>
                                    {canManage(table) && (
                                        <S.RowActions>
                                            <S.BareAction
                                                type="button"
                                                title="Edit data table"
                                                onClick={event => {
                                                    event.stopPropagation();
                                                    openEdit(table);
                                                }}
                                            >
                                                <Icon icon="lucide:pencil" width={12} />
                                            </S.BareAction>
                                            <S.BareAction
                                                $danger
                                                type="button"
                                                title="Delete data table"
                                                aria-label={`Delete ${table.name}`}
                                                onClick={event => {
                                                    event.stopPropagation();
                                                    void removeTables([table]);
                                                }}
                                            >
                                                <Icon icon="lucide:trash-2" width={12} />
                                            </S.BareAction>
                                        </S.RowActions>
                                    )}
                                </S.TableListRow>
                                        ))}
                                    </Fragment>
                                );
                            })}
                            {filteredTables.length === 0 && (
                                <S.EmptyState>
                                    {dataTables.length === 0
                                        ? 'No data tables yet.\nCreate one to store rows.'
                                        : 'No data tables match your filters.'}
                                </S.EmptyState>
                            )}
                        </S.List>
                    </S.Panel>
                    {tableData && activeTable ? (
                        <DataGrid
                            key={String(activeTable.id)}
                            data={tableData}
                            loading={loadingData}
                            canManage={canManage(activeTable)}
                            mobileVisible={mobilePane === 'data'}
                            onLoadPage={(page, filters, limit, sort) => (
                                loadTable(activeTable.id, page, filters, limit, sort)
                            )}
                            onCountsChange={syncCounts}
                            onColumnsChange={syncColumns}
                        />
                    ) : (
                        <S.GridPanel $mobileVisible={mobilePane === 'data'}>
                            {loadingData ? (
                                <S.Loading><Icon icon="lucide:loader-circle" width={20} /></S.Loading>
                            ) : (
                                <S.EmptyState>
                                    Select or create a data table to view its data.
                                </S.EmptyState>
                            )}
                        </S.GridPanel>
                    )}
                </S.Container>
            </S.Page>
            <DataTableModal
                dataTable={editingTable}
                groups={groups}
                isOpen={modalOpen}
                teams={teams}
                submitting={modalSubmitting}
                error={modalError}
                onClose={() => setModalOpen(false)}
                onSubmit={saveTable}
            />
            <ConfirmModal />
        </AppLayout>
    );
}
