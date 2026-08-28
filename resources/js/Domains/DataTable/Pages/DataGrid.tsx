import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { invalidateDataTableCache } from '@/Domains/Flow/Pages/FlowEditor/utils/dataTableSuggestions';
import { columnTypeIcon } from '../columnTypes';
import { dataTableApi, DataTableApiError } from '../api';
import type {
    DataTableCellValue,
    DataTableColumn,
    DataTableColumnType,
    DataTableData,
    DataTableExportFormat,
    DataTableExportScope,
    DataTableFilter,
    DataTableRow,
    DataTableSort,
} from '../types';
import DataTableColumnFilter from './DataTableColumnFilter';
import DataTableColumnTypeSelect from './DataTableColumnTypeSelect';
import DataTableExportModal from './DataTableExportModal';
import DataTableImportModal from './DataTableImportModal';
import * as S from './styled';

interface Props {
    data: DataTableData;
    loading: boolean;
    canManage: boolean;
    mobileVisible: boolean;
    onLoadPage: (
        page: number,
        filters: DataTableFilter[],
        limit: number,
        sort: DataTableSort | null,
    ) => Promise<void>;
    onCountsChange: (counts: { rows_count?: number; columns_count?: number }) => void;
    onColumnsChange: (columns: DataTableColumn[]) => void;
}

const PER_PAGE_OPTIONS = [20, 50, 100];
const ID_COLUMN_WIDTH = 80;

type SystemColumnKey = 'id' | 'created_at' | 'updated_at';

const SYSTEM_COLUMN_DEFAULTS: Record<
    SystemColumnKey,
    { width: number; minWidth: number; compact: boolean }
> = {
    id: { width: ID_COLUMN_WIDTH, minWidth: 68, compact: true },
    created_at: { width: 200, minWidth: 120, compact: false },
    updated_at: { width: 200, minWidth: 120, compact: false },
};

const valueFor = (row: DataTableRow, column: DataTableColumn): DataTableCellValue => (
    row.values[String(column.id)] ?? row.values[column.name] ?? null
);

const inputValue = (value: DataTableCellValue, type: DataTableColumnType) => {
    if (value === null) return '';
    if (type === 'datetime') {
        const date = new Date(String(value));
        if (Number.isNaN(date.getTime())) return '';
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
        return localDate.toISOString().slice(0, 16);
    }
    return String(value);
};

const defaultColumnWidth = (column: DataTableColumn, rows: DataTableRow[]) => {
    const longestValue = rows.reduce((longest, row) => {
        const value = valueFor(row, column);
        const length = value === null
            ? 4
            : String(value).split(/\r?\n/).reduce((max, line) => Math.max(max, line.length), 0);
        return Math.max(longest, length);
    }, 0);
    const valueWidth = longestValue * 7.5 + 20;
    const headerWidth = column.name.length * 7 + 126;

    return Math.min(360, Math.max(180, valueWidth, headerWidth));
};

const parsedValue = (value: string, type: DataTableColumnType): DataTableCellValue => {
    if (value === '') return null;
    if (type === 'number') return Number(value);
    if (type === 'boolean') return value === 'true';
    if (type === 'datetime') return new Date(value).toISOString();
    return value;
};

const BOOLEAN_OPTIONS = [
    { value: '', label: 'NULL', icon: 'lucide:minus' },
    { value: 'true', label: 'TRUE', icon: 'lucide:check' },
    { value: 'false', label: 'FALSE', icon: 'lucide:x' },
];

const stringWithLineFeeds = (value: string) => {
    const lines = value.split(/\r\n|\r|\n/);
    return lines.map((line, index) => (
        <span key={index}>
            {line}
            {index < lines.length - 1 && (
                <S.LineFeedMark title="Line feed" aria-label="Line feed">
                    <Icon icon="lucide:corner-down-left" width={11} height={11} />
                </S.LineFeedMark>
            )}
        </span>
    ));
};

function BooleanCellEditor({
    value,
    onSelect,
    onClose,
}: {
    value: string;
    onSelect: (value: string) => void;
    onClose: (restoreFocus?: boolean) => void;
}) {
    const [activeIndex, setActiveIndex] = useState(Math.max(
        0,
        BOOLEAN_OPTIONS.findIndex(option => option.value === value),
    ));
    const rootRef = useRef<HTMLDivElement | null>(null);
    const selected = BOOLEAN_OPTIONS.find(option => option.value === value) ?? BOOLEAN_OPTIONS[0];

    useEffect(() => {
        rootRef.current?.focus();
    }, []);

    return (
        <S.BooleanEditor
            ref={rootRef}
            tabIndex={-1}
            role="combobox"
            aria-expanded="true"
            aria-label="Boolean value"
            onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) onClose();
            }}
            onKeyDown={event => {
                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setActiveIndex(index => Math.min(index + 1, BOOLEAN_OPTIONS.length - 1));
                } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setActiveIndex(index => Math.max(index - 1, 0));
                } else if (event.key === 'Home') {
                    event.preventDefault();
                    setActiveIndex(0);
                } else if (event.key === 'End') {
                    event.preventDefault();
                    setActiveIndex(BOOLEAN_OPTIONS.length - 1);
                } else if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(BOOLEAN_OPTIONS[activeIndex].value);
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    onClose(true);
                }
            }}
        >
            <S.BooleanEditorValue>
                <Icon icon={selected.icon} width={12} />
                <span>{selected.label}</span>
                <Icon icon="lucide:chevron-up" width={12} />
            </S.BooleanEditorValue>
            <S.BooleanEditorMenu role="listbox">
                {BOOLEAN_OPTIONS.map((option, index) => (
                    <S.BooleanEditorOption
                        key={option.label}
                        type="button"
                        role="option"
                        aria-selected={option.value === value}
                        $active={index === activeIndex}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => onSelect(option.value)}
                    >
                        <Icon icon={option.icon} width={12} />
                        {option.label}
                    </S.BooleanEditorOption>
                ))}
            </S.BooleanEditorMenu>
        </S.BooleanEditor>
    );
}

function SelectionCheckbox({
    checked,
    mixed = false,
    label,
    onChange,
}: {
    checked: boolean;
    mixed?: boolean;
    label: string;
    onChange: () => void;
}) {
    return (
        <S.SelectionCheckbox
            type="button"
            role="checkbox"
            aria-checked={mixed ? 'mixed' : checked}
            aria-label={label}
            $checked={checked}
            $mixed={mixed}
            onClick={onChange}
        >
            {checked && <Icon icon="lucide:check" width={13} height={13} />}
            {mixed && <Icon icon="lucide:minus" width={13} height={13} />}
        </S.SelectionCheckbox>
    );
}

function ColumnActionsMenu({
    onRename,
    onDelete,
}: {
    onRename: () => void;
    onDelete: () => void;
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLSpanElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const dismiss = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        const handleKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            setOpen(false);
            triggerRef.current?.focus();
        };
        document.addEventListener('mousedown', dismiss);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', dismiss);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    return (
        <S.ColumnMenuRoot ref={rootRef}>
            <S.TinyAction
                ref={triggerRef}
                type="button"
                title="Column options"
                aria-label="Column options"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen(current => !current)}
            >
                <Icon icon="lucide:ellipsis" width={13} />
            </S.TinyAction>
            {open && (
                <S.ColumnMenu role="menu">
                    <S.ColumnMenuItem
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setOpen(false);
                            onRename();
                        }}
                    >
                        <Icon icon="lucide:pencil" width={13} />
                        Rename
                    </S.ColumnMenuItem>
                    <S.ColumnMenuItem
                        type="button"
                        role="menuitem"
                        $danger
                        onClick={() => {
                            setOpen(false);
                            onDelete();
                        }}
                    >
                        <Icon icon="lucide:trash-2" width={13} />
                        Delete
                    </S.ColumnMenuItem>
                </S.ColumnMenu>
            )}
        </S.ColumnMenuRoot>
    );
}

export default function DataGrid({
    data,
    loading,
    canManage,
    mobileVisible,
    onLoadPage,
    onCountsChange,
    onColumnsChange,
}: Props) {
    const { confirm, ConfirmModal } = useConfirm();
    const [view, setView] = useState(data);
    const [filters, setFilters] = useState<DataTableFilter[]>([]);
    const [sort, setSort] = useState<DataTableSort | null>({ column: 'id', direction: 'asc' });
    const [selectedRows, setSelectedRows] = useState<Set<Id>>(new Set());
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [savingCells, setSavingCells] = useState<Set<string>>(new Set());
    const [showAddColumn, setShowAddColumn] = useState(false);
    const [columnName, setColumnName] = useState('');
    const [columnType, setColumnType] = useState<DataTableColumnType>('string');
    const [editingColumn, setEditingColumn] = useState<Id | null>(null);
    const [editingColumnName, setEditingColumnName] = useState('');
    const [expandedCell, setExpandedCell] = useState<string | null>(null);
    const [editingBooleanCell, setEditingBooleanCell] = useState<string | null>(null);
    const [editingScalarCell, setEditingScalarCell] = useState<string | null>(null);
    const [focusedCell, setFocusedCell] = useState<string | null>(null);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const cancelledCellRef = useRef<string | null>(null);
    const resizeCleanupRef = useRef<(() => void) | null>(null);
    const [working, setWorking] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setView(data);
        setSelectedRows(new Set());
        setDrafts({});
        setExpandedCell(null);
        setEditingBooleanCell(null);
        setEditingScalarCell(null);
        setFocusedCell(null);
        cancelledCellRef.current = null;
        setError('');
    }, [data]);

    useEffect(() => {
        const clearCellFocus = (event: MouseEvent) => {
            if ((event.target as Element).closest?.('[data-data-table-cell="true"]')) return;
            setFocusedCell(null);
        };
        document.addEventListener('mousedown', clearCellFocus);
        return () => document.removeEventListener('mousedown', clearCellFocus);
    }, []);

    useEffect(() => () => resizeCleanupRef.current?.(), []);

    const sortedColumns = useMemo(
        () => [...view.columns].sort((a, b) => a.position - b.position),
        [view.columns],
    );
    const pageRowIds = view.rows.data.map(row => row.id);
    const allSelected = pageRowIds.length > 0 && pageRowIds.every(id => selectedRows.has(id));
    const someSelected = pageRowIds.some(id => selectedRows.has(id));

    const messageFor = (caught: unknown) => (
        caught instanceof DataTableApiError ? caught.message : 'The request could not be completed.'
    );

    const startColumnResize = (
        event: React.PointerEvent<HTMLButtonElement>,
        key: string,
        currentWidth: number,
        minWidth = 50,
    ) => {
        event.preventDefault();
        event.stopPropagation();
        resizeCleanupRef.current?.();
        const startX = event.clientX;
        const previousCursor = document.body.style.cursor;
        const previousUserSelect = document.body.style.userSelect;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const move = (pointerEvent: PointerEvent) => {
            const width = Math.max(minWidth, currentWidth + pointerEvent.clientX - startX);
            setColumnWidths(current => ({ ...current, [key]: width }));
        };
        const cleanup = () => {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', cleanup);
            document.removeEventListener('pointercancel', cleanup);
            document.body.style.cursor = previousCursor;
            document.body.style.userSelect = previousUserSelect;
            resizeCleanupRef.current = null;
        };

        resizeCleanupRef.current = cleanup;
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', cleanup);
        document.addEventListener('pointercancel', cleanup);
    };

    const copyCell = (
        event: React.ClipboardEvent<HTMLElement>,
        value: DataTableCellValue,
    ) => {
        event.preventDefault();
        event.clipboardData.setData('text/plain', value === null ? '' : String(value));
    };

    const focusAndRevealCell = (cell: HTMLElement) => {
        cell.focus({ preventScroll: true });
        const scroller = cell.closest<HTMLElement>('[data-grid-scroller="true"]');
        if (!scroller) return;
        const cellRect = cell.getBoundingClientRect();
        const scrollerRect = scroller.getBoundingClientRect();
        const leftEdge = scrollerRect.left + 32;
        const topEdge = scrollerRect.top + 38;
        let left = 0;
        let top = 0;

        if (cellRect.left < leftEdge) left = cellRect.left - leftEdge;
        else if (cellRect.right > scrollerRect.right) left = cellRect.right - scrollerRect.right;
        if (cellRect.top < topEdge) top = cellRect.top - topEdge;
        else if (cellRect.bottom > scrollerRect.bottom) top = cellRect.bottom - scrollerRect.bottom;
        if (left || top) scroller.scrollBy({ left, top });
    };

    const focusCell = (key: string) => {
        requestAnimationFrame(() => {
            const cells = document.querySelectorAll<HTMLElement>('[data-data-table-cell="true"]');
            const cell = [...cells].find(candidate => candidate.dataset.cellKey === key);
            if (cell) focusAndRevealCell(cell);
        });
    };

    const handleCellNavigation = (
        event: React.KeyboardEvent<HTMLTableCellElement>,
        onEdit?: () => void,
        onClear?: () => void,
        onType?: (value: string) => void,
    ) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' && onEdit) {
            event.preventDefault();
            onEdit();
            return;
        }
        if ((event.key === 'Delete' || event.key === 'Backspace') && onClear) {
            event.preventDefault();
            onClear();
            return;
        }
        if (
            event.key.length === 1
            && !event.metaKey
            && !event.ctrlKey
            && !event.altKey
            && onType
        ) {
            event.preventDefault();
            onType(event.key);
            return;
        }
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;

        const currentCell = event.currentTarget;
        const currentRow = currentCell.closest('tr');
        const body = currentRow?.parentElement;
        if (!currentRow || !body) return;
        const rows = [...body.querySelectorAll<HTMLTableRowElement>(':scope > tr')]
            .filter(row => row.querySelector('[data-data-table-cell="true"]'));
        const rowIndex = rows.indexOf(currentRow);
        const cells = [...currentRow.querySelectorAll<HTMLTableCellElement>(
            '[data-data-table-cell="true"]',
        )];
        const columnIndex = cells.indexOf(currentCell);
        let target: HTMLTableCellElement | undefined;

        if (event.key === 'ArrowLeft') target = cells[columnIndex - 1];
        if (event.key === 'ArrowRight') target = cells[columnIndex + 1];
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            const targetRow = rows[rowIndex + (event.key === 'ArrowUp' ? -1 : 1)];
            target = targetRow
                ? [...targetRow.querySelectorAll<HTMLTableCellElement>(
                    '[data-data-table-cell="true"]',
                )][columnIndex]
                : undefined;
        }
        if (!target) return;
        event.preventDefault();
        focusAndRevealCell(target);
    };

    const setRow = (updated: DataTableRow) => {
        setView(current => ({
            ...current,
            rows: {
                ...current.rows,
                data: current.rows.data.map(row => row.id === updated.id ? updated : row),
            },
        }));
    };

    const clearDraft = (key: string) => setDrafts(current => {
        const next = { ...current };
        delete next[key];
        return next;
    });

    const setDraft = (key: string, value: string) => (
        setDrafts(current => ({ ...current, [key]: value }))
    );

    const cancelCellEdit = (key: string, closeEditor: () => void) => {
        cancelledCellRef.current = key;
        clearDraft(key);
        closeEditor();
    };

    const persistCell = async (
        row: DataTableRow,
        column: DataTableColumn,
        key: string,
        value: DataTableCellValue,
        discardDraftOnError = false,
    ) => {
        setSavingCells(current => new Set(current).add(key));
        setError('');
        try {
            const updated = await dataTableApi.updateCell(
                view.table.id,
                row.id,
                column.id,
                value,
            );
            setRow(updated);
            clearDraft(key);
        } catch (caught) {
            setError(messageFor(caught));
            if (discardDraftOnError) clearDraft(key);
        } finally {
            setSavingCells(current => {
                const next = new Set(current);
                next.delete(key);
                return next;
            });
        }
    };

    const saveCell = async (row: DataTableRow, column: DataTableColumn) => {
        const key = `${row.id}:${column.id}`;
        if (cancelledCellRef.current === key) {
            cancelledCellRef.current = null;
            return;
        }
        if (!(key in drafts)) return;
        const parsed = parsedValue(drafts[key], column.type);
        if (column.type === 'number' && typeof parsed === 'number' && Number.isNaN(parsed)) {
            setError(`"${column.name}" requires a valid number.`);
            return;
        }
        if (parsed === valueFor(row, column)) {
            clearDraft(key);
            return;
        }

        await persistCell(row, column, key, parsed);
    };

    const updateCellImmediately = async (
        row: DataTableRow,
        column: DataTableColumn,
        key: string,
        value: DataTableCellValue,
        draftValue: string,
    ) => {
        setDrafts(current => ({ ...current, [key]: draftValue }));
        await persistCell(row, column, key, value, true);
    };

    const pasteCell = (
        event: React.ClipboardEvent<HTMLElement>,
        row: DataTableRow,
        column: DataTableColumn,
        key: string,
    ) => {
        if (!canManage || savingCells.has(key)) return;
        event.preventDefault();
        const pasted = event.clipboardData.getData('text/plain').replace(/\r?\n$/, '');
        let value: DataTableCellValue = pasted === '' ? null : pasted;

        if (column.type === 'number' && pasted !== '') {
            value = Number(pasted);
            if (Number.isNaN(value)) {
                setError(`"${column.name}" requires a valid number.`);
                return;
            }
        } else if (column.type === 'boolean' && pasted !== '') {
            const normalized = pasted.trim().toLowerCase();
            if (!['true', 'false', '1', '0'].includes(normalized)) {
                setError(`"${column.name}" requires true, false, 1, 0, or an empty value.`);
                return;
            }
            value = normalized === 'true' || normalized === '1';
        } else if (column.type === 'datetime' && pasted !== '') {
            const date = new Date(pasted);
            if (Number.isNaN(date.getTime())) {
                setError(`"${column.name}" requires a valid date and time.`);
                return;
            }
            value = date.toISOString();
        }

        void updateCellImmediately(
            row,
            column,
            key,
            value,
            inputValue(value, column.type),
        );
    };

    const editCell = (column: DataTableColumn, key: string) => {
        if (!canManage || savingCells.has(key)) return;
        if (column.type === 'boolean') {
            setEditingBooleanCell(key);
        } else if (column.type === 'string') {
            setExpandedCell(key);
        } else {
            setEditingScalarCell(key);
        }
    };

    const scalarEditorProps = (
        row: DataTableRow,
        column: DataTableColumn,
        key: string,
        closeEditor: () => void,
        blurOnPlainEnter = true,
    ) => ({
        autoFocus: true,
        value: drafts[key] ?? inputValue(valueFor(row, column), column.type),
        readOnly: !canManage || savingCells.has(key),
        'aria-label': `${column.name}, row ${row.id}`,
        onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => (
            setDraft(key, event.target.value)
        ),
        onBlur: () => {
            closeEditor();
            void saveCell(row, column);
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            if (event.key === 'Enter' && (blurOnPlainEnter || event.metaKey || event.ctrlKey)) {
                if (!blurOnPlainEnter) event.preventDefault();
                event.currentTarget.blur();
                focusCell(key);
            }
            if (event.key === 'Escape') {
                cancelCellEdit(key, closeEditor);
                event.currentTarget.blur();
                focusCell(key);
            }
        },
    });

    const renderClearToNullButton = (
        row: DataTableRow,
        column: DataTableColumn,
        key: string,
        saving: boolean,
    ) => (
        <S.CellUtilityButton
            type="button"
            title="Set to NULL"
            aria-label={`Clear ${column.name}, row ${row.id}`}
            disabled={saving}
            onMouseDown={event => event.preventDefault()}
            onClick={() => {
                setEditingScalarCell(null);
                void updateCellImmediately(row, column, key, null, '');
            }}
        >
            <Icon icon="lucide:x" width={11} />
        </S.CellUtilityButton>
    );

    const renderResizeHandle = (
        key: string,
        label: string,
        defaultWidth: number,
        minWidth = 50,
    ) => (
        <S.ColumnResizeHandle
            type="button"
            aria-label={`Resize ${label} column`}
            onPointerDown={event => startColumnResize(
                event,
                key,
                columnWidths[key] ?? defaultWidth,
                minWidth,
            )}
            onDoubleClick={() => setColumnWidths(current => {
                const next = { ...current };
                delete next[key];
                return next;
            })}
        />
    );

    const toggleSort = (column: string) => {
        const nextSort: DataTableSort | null = sort?.column !== column
            ? { column, direction: 'asc' }
            : sort.direction === 'asc'
                ? { column, direction: 'desc' }
                : null;
        setSort(nextSort);
        setSelectedRows(new Set());
        void onLoadPage(1, filters, view.rows.per_page, nextSort);
    };

    const sortIcon = (column: string) => sort?.column === column && (
        <Icon
            icon={sort.direction === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down'}
            width={11}
            aria-label={`Sorted ${sort.direction === 'asc' ? 'ascending' : 'descending'}`}
        />
    );

    const handleHeaderSort = (
        event: React.MouseEvent<HTMLTableCellElement>,
        column: string,
    ) => {
        if ((event.target as Element).closest('button, input, [data-column-edit]')) return;
        toggleSort(column);
    };

    const renderSystemHeader = (colKey: SystemColumnKey) => {
        const defaults = SYSTEM_COLUMN_DEFAULTS[colKey];
        return (
            <S.GridHeader
                $system
                $sortable
                $compact={defaults.compact}
                $width={columnWidths[colKey] ?? defaults.width}
                onClick={event => handleHeaderSort(event, colKey)}
            >
                <S.HeaderContent>
                    <S.ColumnName>{colKey}</S.ColumnName>
                    {sortIcon(colKey)}
                    <S.HeaderSpacer />
                    <Icon icon="lucide:lock" width={10} aria-label="Read only" />
                </S.HeaderContent>
                {renderResizeHandle(colKey, colKey, defaults.width, defaults.minWidth)}
            </S.GridHeader>
        );
    };

    const renderSystemCell = (row: DataTableRow, colKey: SystemColumnKey, selected: boolean) => {
        const defaults = SYSTEM_COLUMN_DEFAULTS[colKey];
        const value = colKey === 'id' ? String(row.id) : row[colKey];
        const key = `${row.id}:${colKey}`;
        return (
            <S.GridCell
                $system
                $compact={defaults.compact}
                $width={columnWidths[colKey] ?? defaults.width}
                $selected={selected}
                $focused={focusedCell === key}
                data-data-table-cell="true"
                data-cell-key={key}
                tabIndex={0}
                onFocus={() => setFocusedCell(key)}
                onMouseDownCapture={event => event.currentTarget.focus()}
                onKeyDown={handleCellNavigation}
                onCopy={event => copyCell(event, value)}
            >
                <S.SystemValue title={value}>{value}</S.SystemValue>
            </S.GridCell>
        );
    };

    const addRow = async () => {
        setWorking(true);
        setError('');
        try {
            await dataTableApi.addRow(view.table.id);
            await onLoadPage(1, filters, view.rows.per_page, sort);
            onCountsChange({ rows_count: view.table.rows_count + 1 });
        } catch (caught) {
            setError(messageFor(caught));
        } finally {
            setWorking(false);
        }
    };

    const deleteSelected = async () => {
        if (selectedRows.size === 0) return;
        const confirmed = await confirm({
            title: selectedRows.size === 1 ? 'Delete Row' : 'Delete Rows',
            message: `Permanently delete ${selectedRows.size} selected row${selectedRows.size === 1 ? '' : 's'}?`,
            confirmLabel: `Delete (${selectedRows.size})`,
            variant: 'danger',
        });
        if (!confirmed) return;

        setWorking(true);
        setError('');
        try {
            await dataTableApi.deleteRows(view.table.id, [...selectedRows]);
            const targetPage = (
                selectedRows.size === view.rows.data.length && view.rows.current_page > 1
            ) ? view.rows.current_page - 1 : view.rows.current_page;
            setSelectedRows(new Set());
            await onLoadPage(targetPage, filters, view.rows.per_page, sort);
            onCountsChange({ rows_count: Math.max(0, view.table.rows_count - selectedRows.size) });
        } catch (caught) {
            setError(messageFor(caught));
        } finally {
            setWorking(false);
        }
    };

    const addColumn = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!columnName.trim()) return;
        setWorking(true);
        setError('');
        try {
            const column = await dataTableApi.addColumn(
                view.table.id,
                columnName.trim(),
                columnType,
            );
            const columns = [...view.columns, column];
            setView(current => ({
                ...current,
                columns,
                table: { ...current.table, columns_count: current.table.columns_count + 1 },
            }));
            onColumnsChange(columns);
            setColumnName('');
            setShowAddColumn(false);
            invalidateDataTableCache();
            onCountsChange({ columns_count: view.table.columns_count + 1 });
        } catch (caught) {
            setError(messageFor(caught));
        } finally {
            setWorking(false);
        }
    };

    const renameColumn = async (column: DataTableColumn) => {
        const name = editingColumnName.trim();
        setEditingColumn(null);
        if (!name || name === column.name) return;
        setError('');
        try {
            const updated = await dataTableApi.updateColumn(
                view.table.id,
                column.id,
                { name },
            );
            const columns = view.columns.map(item => item.id === column.id ? updated : item);
            setView(current => ({
                ...current,
                columns,
            }));
            onColumnsChange(columns);
            invalidateDataTableCache();
        } catch (caught) {
            setError(messageFor(caught));
        }
    };

    const moveColumn = async (columnIndex: number, direction: -1 | 1) => {
        const target = columnIndex + direction;
        if (target < 0 || target >= sortedColumns.length) return;
        const reordered = [...sortedColumns];
        [reordered[columnIndex], reordered[target]] = [reordered[target], reordered[columnIndex]];
        const optimistic = reordered.map((column, index) => ({ ...column, position: index }));
        setView(current => ({ ...current, columns: optimistic }));
        setError('');
        try {
            const columns = await dataTableApi.reorderColumns(
                view.table.id,
                reordered.map(column => column.id),
            );
            setView(current => ({ ...current, columns }));
            onColumnsChange(columns);
        } catch (caught) {
            setView(current => ({ ...current, columns: sortedColumns }));
            setError(messageFor(caught));
        }
    };

    const deleteColumn = async (column: DataTableColumn) => {
        const confirmed = await confirm({
            title: 'Delete Column',
            message: `Delete "${column.name}" and all values stored in it?`,
            confirmLabel: 'Delete Column',
            variant: 'danger',
        });
        if (!confirmed) return;

        setWorking(true);
        setError('');
        try {
            await dataTableApi.deleteColumn(view.table.id, column.id);
            const nextFilters = filters.filter(filter => filter.column_id !== column.id);
            const columns = view.columns.filter(item => item.id !== column.id);
            setFilters(nextFilters);
            setView(current => ({
                ...current,
                columns,
                table: { ...current.table, columns_count: current.table.columns_count - 1 },
            }));
            onColumnsChange(columns);
            if (nextFilters.length !== filters.length) {
                await onLoadPage(1, nextFilters, view.rows.per_page, sort);
            }
            invalidateDataTableCache();
            onCountsChange({ columns_count: Math.max(0, view.table.columns_count - 1) });
        } catch (caught) {
            setError(messageFor(caught));
        } finally {
            setWorking(false);
        }
    };

    const toggleRow = (rowId: Id) => {
        setSelectedRows(current => {
            const next = new Set(current);
            if (next.has(rowId)) {
                next.delete(rowId);
            } else {
                next.add(rowId);
            }
            return next;
        });
    };

    const applyFilter = (filter: DataTableFilter) => {
        const nextFilters = [
            ...filters.filter(item => item.column_id !== filter.column_id),
            filter,
        ];
        setFilters(nextFilters);
        void onLoadPage(1, nextFilters, view.rows.per_page, sort);
    };

    const clearFilter = (columnId: Id) => {
        const nextFilters = filters.filter(filter => filter.column_id !== columnId);
        setFilters(nextFilters);
        void onLoadPage(1, nextFilters, view.rows.per_page, sort);
    };

    const exportTable = async (
        format: DataTableExportFormat,
        scope: DataTableExportScope,
    ) => {
        setExporting(true);
        setError('');
        try {
            const { blob, filename } = await dataTableApi.exportTable(view.table.id, {
                format,
                scope,
                filters,
                ids: [...selectedRows],
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            setExportOpen(false);
        } catch (caught) {
            setError(messageFor(caught));
        } finally {
            setExporting(false);
        }
    };

    const importRows = async (rows: Array<Record<string, DataTableCellValue>>) => {
        setImporting(true);
        setError('');
        try {
            const result = await dataTableApi.importRows(view.table.id, { rows });
            setSelectedRows(new Set());
            await onLoadPage(1, filters, view.rows.per_page, sort);
            const rowsCount = view.table.rows_count + result.imported;
            setView(current => ({
                ...current,
                table: { ...current.table, rows_count: rowsCount },
            }));
            onCountsChange({ rows_count: rowsCount });
            setImportOpen(false);
        } catch (caught) {
            setError(messageFor(caught));
        } finally {
            setImporting(false);
        }
    };

    return (
        <S.GridPanel $mobileVisible={mobileVisible}>
            <S.GridToolbar>
                <S.PanelTitleWrap>
                    <Icon icon="lucide:table" width={15} />
                    <S.PanelTitle>{view.table.name}</S.PanelTitle>
                </S.PanelTitleWrap>
                <S.ToolbarGroup>
                    <S.RefreshButton
                        type="button"
                        $loading={loading}
                        disabled={loading}
                        title="Refresh rows"
                        aria-label="Refresh rows"
                        onClick={() => void onLoadPage(
                            view.rows.current_page,
                            filters,
                            view.rows.per_page,
                            sort,
                        )}
                    >
                        <Icon icon="lucide:refresh-cw" width={13} height={13} />
                    </S.RefreshButton>
                    {canManage && selectedRows.size > 0 && (
                        <Button size="sm" variant="danger" onClick={deleteSelected} loading={working}>
                            <Icon icon="lucide:trash-2" width={13} />
                            Delete ({selectedRows.size})
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setExportOpen(true)}
                    >
                        <Icon icon="lucide:download" width={13} />
                        Export
                    </Button>
                    {canManage && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                                setError('');
                                setImportOpen(true);
                            }}
                        >
                            <Icon icon="lucide:upload" width={13} />
                            Import
                        </Button>
                    )}
                    {canManage && (
                        <Button size="sm" variant="secondary" onClick={addRow} loading={working}>
                            <Icon icon="lucide:plus" width={13} />
                            Add Row
                        </Button>
                    )}
                    {canManage && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowAddColumn(current => !current)}
                        >
                            <Icon icon="lucide:panel-top" width={13} />
                            Add Column
                        </Button>
                    )}
                </S.ToolbarGroup>
            </S.GridToolbar>
            {showAddColumn && (
                <S.InlineForm onSubmit={addColumn}>
                    <S.InlineInput
                        autoFocus
                        value={columnName}
                        onChange={event => setColumnName(event.target.value)}
                        placeholder="Column name"
                    />
                    <DataTableColumnTypeSelect
                        value={columnType}
                        onChange={setColumnType}
                    />
                    <Button size="sm" type="submit" loading={working} disabled={!columnName.trim()}>
                        Add
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddColumn(false)}>
                        Cancel
                    </Button>
                </S.InlineForm>
            )}
            {error && <S.ErrorBanner role="alert">{error}</S.ErrorBanner>}
            {loading ? (
                <S.Loading><Icon icon="lucide:loader-circle" width={20} /></S.Loading>
            ) : (
                <S.GridScroller data-grid-scroller="true">
                    <S.GridTable>
                        <thead>
                            <tr>
                                <S.SelectionHeader>
                                    <SelectionCheckbox
                                        checked={allSelected}
                                        mixed={!allSelected && someSelected}
                                        label="Select all rows on this page"
                                        onChange={() => setSelectedRows(
                                            allSelected ? new Set() : new Set(pageRowIds),
                                        )}
                                    />
                                </S.SelectionHeader>
                                {renderSystemHeader('id')}
                                {sortedColumns.map((column, index) => (
                                    <S.GridHeader
                                        key={column.id}
                                        $sortable
                                        $width={columnWidths[`column:${column.id}`]
                                            ?? defaultColumnWidth(column, view.rows.data)}
                                        onClick={event => handleHeaderSort(event, String(column.id))}
                                    >
                                        <S.HeaderContent>
                                            {editingColumn !== column.id && (
                                                <S.ColumnType title={column.type} aria-label={column.type}>
                                                    <Icon
                                                        icon={columnTypeIcon(column.type)}
                                                        width={13}
                                                        height={13}
                                                    />
                                                </S.ColumnType>
                                            )}
                                            {editingColumn === column.id ? (
                                                <S.InlineInput
                                                    autoFocus
                                                    value={editingColumnName}
                                                    onChange={event => setEditingColumnName(event.target.value)}
                                                    onBlur={() => void renameColumn(column)}
                                                    onKeyDown={event => {
                                                        if (event.key === 'Enter') event.currentTarget.blur();
                                                        if (event.key === 'Escape') setEditingColumn(null);
                                                    }}
                                                />
                                            ) : (
                                                <S.ColumnName
                                                    title={column.name}
                                                    data-column-edit={canManage ? 'true' : undefined}
                                                    $editable={canManage}
                                                    onClick={canManage ? () => {
                                                        setEditingColumn(column.id);
                                                        setEditingColumnName(column.name);
                                                    } : undefined}
                                                >
                                                    {column.name}
                                                </S.ColumnName>
                                            )}
                                            {editingColumn !== column.id && sortIcon(String(column.id))}
                                            {editingColumn !== column.id && <S.HeaderSpacer />}
                                            {canManage && editingColumn !== column.id && <S.ColumnActions>
                                                <S.TinyAction
                                                    disabled={index === 0}
                                                    title="Move left"
                                                    onClick={() => void moveColumn(index, -1)}
                                                >
                                                    <Icon icon="lucide:chevron-left" width={12} />
                                                </S.TinyAction>
                                                <S.TinyAction
                                                    disabled={index === sortedColumns.length - 1}
                                                    title="Move right"
                                                    onClick={() => void moveColumn(index, 1)}
                                                >
                                                    <Icon icon="lucide:chevron-right" width={12} />
                                                </S.TinyAction>
                                                <DataTableColumnFilter
                                                    column={column}
                                                    filter={filters.find(filter => filter.column_id === column.id)}
                                                    onApply={applyFilter}
                                                    onClear={() => clearFilter(column.id)}
                                                />
                                                <ColumnActionsMenu
                                                    onRename={() => {
                                                        setEditingColumn(column.id);
                                                        setEditingColumnName(column.name);
                                                    }}
                                                    onDelete={() => void deleteColumn(column)}
                                                />
                                            </S.ColumnActions>}
                                        </S.HeaderContent>
                                        {renderResizeHandle(
                                            `column:${column.id}`,
                                            column.name,
                                            defaultColumnWidth(column, view.rows.data),
                                        )}
                                    </S.GridHeader>
                                ))}
                                {renderSystemHeader('created_at')}
                                {renderSystemHeader('updated_at')}
                                <S.GridHeader $fill>
                                    <S.AppendColumnHeaderContent>
                                        {canManage && (
                                            <S.TinyAction
                                                type="button"
                                                title="Add column"
                                                aria-label="Add column"
                                                $active={showAddColumn}
                                                onClick={() => setShowAddColumn(current => !current)}
                                            >
                                                <Icon icon="lucide:plus" width={13} />
                                            </S.TinyAction>
                                        )}
                                    </S.AppendColumnHeaderContent>
                                </S.GridHeader>
                            </tr>
                        </thead>
                        <tbody>
                            {view.rows.data.map(row => {
                                const selected = selectedRows.has(row.id);
                                return (
                                    <tr key={row.id}>
                                        <S.SelectionCell $selected={selected}>
                                            <SelectionCheckbox
                                                checked={selected}
                                                label={`Select row ${row.id}`}
                                                onChange={() => toggleRow(row.id)}
                                            />
                                        </S.SelectionCell>
                                        {renderSystemCell(row, 'id', selected)}
                                        {sortedColumns.map(column => {
                                            const key = `${row.id}:${column.id}`;
                                            const currentValue = drafts[key] ?? inputValue(valueFor(row, column), column.type);
                                            const saving = savingCells.has(key);
                                            return (
                                                <S.GridCell
                                                    key={column.id}
                                                    data-data-table-cell="true"
                                                    data-cell-key={key}
                                                    $width={columnWidths[`column:${column.id}`]
                                                        ?? defaultColumnWidth(column, view.rows.data)}
                                                    $selected={selected}
                                                    $focused={focusedCell === key}
                                                    tabIndex={0}
                                                    onFocus={() => setFocusedCell(key)}
                                                    onMouseDownCapture={event => {
                                                        if ((event.target as Element).closest(
                                                            'button, input, textarea, select, [role="combobox"]',
                                                        )) return;
                                                        setFocusedCell(key);
                                                        event.currentTarget.focus();
                                                    }}
                                                    onCopy={event => copyCell(event, valueFor(row, column))}
                                                    onPaste={event => pasteCell(event, row, column, key)}
                                                    onKeyDown={event => handleCellNavigation(
                                                        event,
                                                        () => editCell(column, key),
                                                        () => {
                                                            if (!canManage || saving || valueFor(row, column) === null) return;
                                                            void updateCellImmediately(row, column, key, null, '');
                                                        },
                                                        value => {
                                                            if (!canManage || saving) return;
                                                            if (column.type === 'string' || column.type === 'number') {
                                                                setDraft(key, value);
                                                            }
                                                            editCell(column, key);
                                                        },
                                                    )}
                                                >
                                                    {column.type === 'boolean' ? (
                                                        editingBooleanCell === key ? (
                                                            <BooleanCellEditor
                                                                value={currentValue}
                                                                onClose={restoreFocus => {
                                                                    setEditingBooleanCell(null);
                                                                    if (restoreFocus) focusCell(key);
                                                                }}
                                                                onSelect={value => {
                                                                    setEditingBooleanCell(null);
                                                                    void updateCellImmediately(
                                                                        row,
                                                                        column,
                                                                        key,
                                                                        parsedValue(value, column.type),
                                                                        value,
                                                                    );
                                                                    focusCell(key);
                                                                }}
                                                            />
                                                        ) : (
                                                            <S.BooleanCellWrap
                                                                $disabled={!canManage || saving}
                                                                title="Double-click to edit"
                                                                onDoubleClick={() => editCell(column, key)}
                                                            >
                                                                <S.BooleanLabel>
                                                                    {currentValue === '' ? 'NULL' : currentValue.toUpperCase()}
                                                                </S.BooleanLabel>
                                                            </S.BooleanCellWrap>
                                                        )
                                                    ) : column.type === 'datetime' && editingScalarCell === key ? (
                                                        <S.DateTimeCellWrap data-datetime-cell>
                                                            <S.CellInput
                                                                type="datetime-local"
                                                                {...scalarEditorProps(
                                                                    row,
                                                                    column,
                                                                    key,
                                                                    () => setEditingScalarCell(null),
                                                                )}
                                                                onFocus={event => event.currentTarget.showPicker()}
                                                            />
                                                            <S.DateTimeActions>
                                                                {currentValue !== '' && canManage && (
                                                                    renderClearToNullButton(row, column, key, saving)
                                                                )}
                                                                <S.CellUtilityButton
                                                                    type="button"
                                                                    title="Choose date and time"
                                                                    aria-label={`Choose ${column.name}, row ${row.id}`}
                                                                    disabled={!canManage || saving}
                                                                    onMouseDown={event => event.preventDefault()}
                                                                    onClick={event => {
                                                                        const input = event.currentTarget
                                                                            .closest('[data-datetime-cell]')
                                                                            ?.querySelector('input');
                                                                        input?.showPicker();
                                                                    }}
                                                                >
                                                                    <Icon icon="lucide:calendar" width={12} />
                                                                </S.CellUtilityButton>
                                                            </S.DateTimeActions>
                                                        </S.DateTimeCellWrap>
                                                    ) : column.type === 'string' && expandedCell === key ? (
                                                        <S.CellTextarea
                                                            placeholder="NULL"
                                                            {...scalarEditorProps(
                                                                row,
                                                                column,
                                                                key,
                                                                () => setExpandedCell(null),
                                                                false,
                                                            )}
                                                        />
                                                    ) : column.type === 'number' && editingScalarCell === key ? (
                                                        <S.ValueCellWrap>
                                                            <S.CellInput
                                                                type="number"
                                                                placeholder="NULL"
                                                                {...scalarEditorProps(
                                                                    row,
                                                                    column,
                                                                    key,
                                                                    () => setEditingScalarCell(null),
                                                                )}
                                                            />
                                                            {currentValue !== '' && canManage && (
                                                                <S.CellInputActions>
                                                                    {renderClearToNullButton(row, column, key, saving)}
                                                                </S.CellInputActions>
                                                            )}
                                                        </S.ValueCellWrap>
                                                    ) : (
                                                        <S.CellDisplay
                                                            $disabled={!canManage || saving}
                                                            title={canManage ? 'Double-click to edit' : undefined}
                                                            onDoubleClick={() => editCell(column, key)}
                                                        >
                                                            <S.CellDisplayValue $null={currentValue === ''}>
                                                                {currentValue === ''
                                                                    ? 'NULL'
                                                                    : column.type === 'string'
                                                                        ? stringWithLineFeeds(currentValue)
                                                                        : currentValue}
                                                            </S.CellDisplayValue>
                                                        </S.CellDisplay>
                                                    )}
                                                </S.GridCell>
                                            );
                                        })}
                                        {renderSystemCell(row, 'created_at', selected)}
                                        {renderSystemCell(row, 'updated_at', selected)}
                                        <S.GridCell
                                            $fill
                                            $selected={selected}
                                            aria-hidden="true"
                                        />
                                    </tr>
                                );
                            })}
                            {canManage && (
                                <tr>
                                    <S.AppendRowCell colSpan={sortedColumns.length + 5}>
                                        <S.TinyAction
                                            type="button"
                                            title="Add row"
                                            aria-label="Add row"
                                            disabled={working}
                                            onClick={() => void addRow()}
                                        >
                                            <Icon icon="lucide:plus" width={13} />
                                        </S.TinyAction>
                                    </S.AppendRowCell>
                                </tr>
                            )}
                        </tbody>
                    </S.GridTable>
                    {view.rows.data.length === 0 && (
                        <S.EmptyState>No rows yet.{'\n'}Add a row to start entering data.</S.EmptyState>
                    )}
                </S.GridScroller>
            )}
            <S.GridFooter>
                <span>
                    {view.rows.total === 0
                        ? '0 rows'
                        : `${((view.rows.current_page - 1) * view.rows.per_page) + 1}-${Math.min(view.rows.current_page * view.rows.per_page, view.rows.total)} of ${view.rows.total}`}
                </span>
                <S.Pagination>
                    <S.IconButton
                        disabled={loading || view.rows.current_page <= 1}
                        title="Previous page"
                        onClick={() => void onLoadPage(
                            view.rows.current_page - 1,
                            filters,
                            view.rows.per_page,
                            sort,
                        )}
                    >
                        <Icon icon="lucide:chevron-left" width={14} />
                    </S.IconButton>
                    <span>Page {view.rows.current_page} of {Math.max(1, view.rows.last_page)}</span>
                    <S.IconButton
                        disabled={loading || view.rows.current_page >= view.rows.last_page}
                        title="Next page"
                        onClick={() => void onLoadPage(
                            view.rows.current_page + 1,
                            filters,
                            view.rows.per_page,
                            sort,
                        )}
                    >
                        <Icon icon="lucide:chevron-right" width={14} />
                    </S.IconButton>
                    <S.PaginationLimit>
                        <span>Limit</span>
                        <S.PaginationLimitSelect
                            value={view.rows.per_page}
                            disabled={loading}
                            onChange={event => void onLoadPage(
                                1,
                                filters,
                                Number(event.target.value),
                                sort,
                            )}
                        >
                            {PER_PAGE_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </S.PaginationLimitSelect>
                    </S.PaginationLimit>
                </S.Pagination>
            </S.GridFooter>
            <DataTableExportModal
                isOpen={exportOpen}
                tableName={view.table.name}
                totalRows={view.table.rows_count}
                filteredRows={view.rows.total}
                selectedRows={selectedRows.size}
                hasFilters={filters.length > 0}
                submitting={exporting}
                onClose={() => setExportOpen(false)}
                onExport={exportTable}
            />
            <DataTableImportModal
                isOpen={importOpen}
                tableName={view.table.name}
                columns={sortedColumns}
                submitting={importing}
                apiError={error}
                onClose={() => setImportOpen(false)}
                onClearError={() => setError('')}
                onImport={importRows}
            />
            <ConfirmModal />
        </S.GridPanel>
    );
}
