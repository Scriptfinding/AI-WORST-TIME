export type DataTableScope = 'owner' | 'team' | 'workspace';
export type DataTableColumnType = 'string' | 'number' | 'boolean' | 'datetime';
export type DataTableCellValue = string | number | boolean | null;
export type DataTableExportFormat = 'csv' | 'json' | 'xml';
export type DataTableExportScope = 'all' | 'filtered' | 'selected';
export interface DataTableFilter {
    column_id: Id;
    operator: string;
    value?: string;
}

export interface DataTableExportPayload {
    format: DataTableExportFormat;
    scope: DataTableExportScope;
    filters: DataTableFilter[];
    ids: Id[];
}

export interface DataTableImportPayload {
    rows: Array<Record<string, DataTableCellValue>>;
}

export interface DataTableImportResponse {
    imported: number;
}

export interface DataTable {
    id: Id;
    name: string;
    description: string | null;
    visibility: DataTableScope;
    team_id: Id | null;
    team_name: string | null;
    user_id: Id | null;
    user_name: string | null;
    owner_workspace_role?: 'admin' | 'manager' | 'member';
    can_manage: boolean;
    rows_count: number;
    columns_count: number;
    created_at: string;
    updated_at: string;
}

export interface DataTableColumn {
    id: Id;
    name: string;
    type: DataTableColumnType;
    position: number;
    nullable?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface DataTableRow {
    id: Id;
    values: Record<string, DataTableCellValue>;
    created_at: string;
    updated_at: string;
}

export interface DataTableRowsPage {
    data: DataTableRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface DataTableData {
    table: DataTable;
    columns: DataTableColumn[];
    rows: DataTableRowsPage;
}

export interface DataTablesPageProps {
    dataTables: DataTable[];
    teams?: { id: Id; name: string }[];
    isAdmin?: boolean;
    selectedDataTableId?: Id | null;
    tableData?: DataTableData | null;
}

export interface DataTablePayload {
    name: string;
    description?: string | null;
    visibility: DataTableScope;
    team_id: Id | null;
    user_id?: Id | null;
}
