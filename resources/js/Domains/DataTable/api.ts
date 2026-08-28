import { csrfHeaders } from '@/Shared/Utils/csrf';
import type {
    DataTable,
    DataTableColumn,
    DataTableColumnType,
    DataTableData,
    DataTableExportPayload,
    DataTableFilter,
    DataTableImportPayload,
    DataTableImportResponse,
    DataTablePayload,
    DataTableRow,
} from './types';

export class DataTableApiError extends Error {
    constructor(message: string, public readonly errors?: Record<string, string[]>) {
        super(message);
        this.name = 'DataTableApiError';
    }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...csrfHeaders(),
            ...options?.headers,
        },
    });
    const body = response.status === 204 ? null : await response.json().catch(() => null);

    if (!response.ok) {
        throw new DataTableApiError(
            body?.message || `Request failed with status ${response.status}.`,
            body?.errors,
        );
    }

    return (body?.data ?? body) as T;
}

const json = (body: unknown): Pick<RequestInit, 'body'> => ({
    body: JSON.stringify(body),
});

export const dataTableApi = {
    createTable: (payload: DataTablePayload) => request<DataTable>('/data-tables', {
        method: 'POST',
        ...json(payload),
    }),
    updateTable: (tableId: Id, payload: DataTablePayload) => request<DataTable>(
        `/data-tables/${tableId}`,
        { method: 'PUT', ...json(payload) },
    ),
    deleteTable: (tableId: Id) => request<void>(`/data-tables/${tableId}`, {
        method: 'DELETE',
    }),
    deleteTables: (tableIds: Id[]) => request<void>(
        '/data-tables/bulk-delete',
        { method: 'DELETE', ...json({ ids: tableIds }) },
    ),
    getTable: (
        tableId: Id,
        page = 1,
        filters: DataTableFilter[] = [],
        limit = 50,
    ) => {
        const query = new URLSearchParams({
            page: String(page),
            per_page: String(limit),
        });
        filters.forEach((filter, index) => {
            query.set(`filters[${index}][column_id]`, String(filter.column_id));
            query.set(`filters[${index}][operator]`, filter.operator);
            if (filter.value !== undefined) query.set(`filters[${index}][value]`, filter.value);
        });
        return request<Omit<DataTableData, 'table'> & { data_table: DataTable }>(
            `/data-tables/${tableId}?${query}`,
        ).then(({ data_table: table, ...data }) => ({ ...data, table }));
    },
    exportTable: async (
        tableId: Id,
        payload: DataTableExportPayload,
    ): Promise<{ blob: Blob; filename: string }> => {
        const response = await fetch(`/data-tables/${tableId}/export`, {
            method: 'POST',
            headers: {
                Accept: 'text/csv, application/json, application/xml',
                'Content-Type': 'application/json',
                ...csrfHeaders(),
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new DataTableApiError(
                body?.message || `Request failed with status ${response.status}.`,
                body?.errors,
            );
        }

        const disposition = response.headers.get('Content-Disposition') ?? '';
        const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1]
            ?? `data-table-export.${payload.format}`;

        return { blob: await response.blob(), filename };
    },
    importRows: (tableId: Id, payload: DataTableImportPayload) => request<DataTableImportResponse>(
        `/data-tables/${tableId}/rows/import`,
        { method: 'POST', ...json(payload) },
    ),
    addRow: (tableId: Id) => request<DataTableRow>(
        `/data-tables/${tableId}/rows`,
        { method: 'POST', ...json({ values: {} }) },
    ),
    updateCell: (
        tableId: Id,
        rowId: Id,
        columnId: Id,
        value: unknown,
    ) => request<DataTableRow>(
        `/data-tables/${tableId}/rows/${rowId}`,
        { method: 'PUT', ...json({ values: { [String(columnId)]: value } }) },
    ),
    deleteRows: (tableId: Id, rowIds: Id[]) => request<void>(
        `/data-tables/${tableId}/rows/bulk-delete`,
        { method: 'DELETE', ...json({ ids: rowIds }) },
    ),
    addColumn: (tableId: Id, name: string, type: DataTableColumnType) => (
        request<DataTableColumn>(`/data-tables/${tableId}/columns`, {
            method: 'POST',
            ...json({ name, type }),
        })
    ),
    updateColumn: (
        tableId: Id,
        columnId: Id,
        payload: { name?: string; position?: number },
    ) => request<DataTableColumn>(
        `/data-tables/${tableId}/columns/${columnId}`,
        { method: 'PUT', ...json(payload) },
    ),
    reorderColumns: (tableId: Id, columnIds: Id[]) => request<DataTableColumn[]>(
        `/data-tables/${tableId}/columns/reorder`,
        { method: 'PUT', ...json({ ids: columnIds }) },
    ),
    deleteColumn: (tableId: Id, columnId: Id) => request<void>(
        `/data-tables/${tableId}/columns/${columnId}`,
        { method: 'DELETE' },
    ),
};
