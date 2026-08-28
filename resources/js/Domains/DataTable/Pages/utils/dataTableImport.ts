import type {
    DataTableCellValue,
    DataTableColumn,
    DataTableExportFormat,
} from '../../types';

export interface DataTableImportResult {
    format: DataTableExportFormat | null;
    totalRows: number;
    rows: Array<Record<string, DataTableCellValue>>;
    errors: string[];
}

const SYSTEM_FIELDS = new Set(['id', 'created_at', 'updated_at']);
const MAX_ROWS = 1000;

const detectFormat = (raw: string, fileName: string | null): DataTableExportFormat => {
    const content = raw.replace(/^\uFEFF/, '').trimStart();
    if (content.startsWith('[') || content.startsWith('{')) return 'json';
    if (content.startsWith('<')) return 'xml';
    const extension = fileName?.split('.').pop()?.toLowerCase();
    if (extension === 'json' || extension === 'xml' || extension === 'csv') return extension;
    return 'csv';
};

const displayValue = (value: unknown) => (
    typeof value === 'string' ? `"${value}"` : JSON.stringify(value)
);

const normalizeValue = (
    value: unknown,
    column: DataTableColumn,
    rowNumber: number,
    errors: string[],
): DataTableCellValue => {
    if (value === null || (typeof value === 'string' && value.trim() === '')) return null;

    if (column.type === 'string') {
        if (typeof value !== 'string') {
            errors.push(`Row ${rowNumber}, column "${column.name}": expected a string, received ${displayValue(value)}.`);
            return null;
        }
        return value;
    }

    if (column.type === 'number') {
        const number = typeof value === 'number'
            ? value
            : typeof value === 'string' && value.trim() !== ''
                ? Number(value)
                : Number.NaN;
        if (!Number.isFinite(number)) {
            errors.push(`Row ${rowNumber}, column "${column.name}": expected a finite number, received ${displayValue(value)}.`);
            return null;
        }
        return number;
    }

    if (column.type === 'boolean') {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (normalized === 'true') return true;
            if (normalized === 'false') return false;
        }
        errors.push(`Row ${rowNumber}, column "${column.name}": expected true or false, received ${displayValue(value)}.`);
        return null;
    }

    if (typeof value === 'string') {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
    errors.push(`Row ${rowNumber}, column "${column.name}": expected a valid date and time, received ${displayValue(value)}.`);
    return null;
};

const columnLookup = (columns: DataTableColumn[]) => new Map(
    columns.map(column => [column.name.toLowerCase(), column]),
);

const mapRecords = (
    records: Array<Record<string, unknown>>,
    columns: DataTableColumn[],
): Pick<DataTableImportResult, 'rows' | 'errors'> => {
    const lookup = columnLookup(columns);
    const errors: string[] = [];
    const rows: Array<Record<string, DataTableCellValue>> = [];
    const usedColumns = new Set<string>();

    records.slice(0, MAX_ROWS).forEach((record, index) => {
        const rowNumber = index + 1;
        const mapped: Record<string, DataTableCellValue> = {};
        const seen = new Set<string>();

        Object.entries(record).forEach(([name, value]) => {
            const normalizedName = name.toLowerCase();
            if (SYSTEM_FIELDS.has(normalizedName)) return;
            const column = lookup.get(normalizedName);
            if (!column) {
                errors.push(`Row ${rowNumber}, column "${name}": the column does not exist in this table.`);
                return;
            }
            const columnId = String(column.id);
            if (seen.has(columnId)) {
                errors.push(`Row ${rowNumber}, column "${name}": this column is provided more than once.`);
                return;
            }
            seen.add(columnId);
            usedColumns.add(columnId);
            mapped[columnId] = normalizeValue(value, column, rowNumber, errors);
        });

        columns.forEach(column => {
            const columnId = String(column.id);
            if (!(columnId in mapped)) mapped[columnId] = null;
        });
        rows.push(mapped);
    });

    if (records.length > MAX_ROWS) {
        errors.push(`This import contains ${records.length} rows. The maximum is ${MAX_ROWS}.`);
    }
    if (records.length === 0) errors.push('The import does not contain any rows.');
    if (usedColumns.size === 0 && records.length > 0) {
        errors.push('The import does not contain any usable custom columns.');
    }

    return { rows, errors };
};

const parseJson = (raw: string): { records: Array<Record<string, unknown>>; errors: string[] } => {
    try {
        const value: unknown = JSON.parse(raw);
        if (!Array.isArray(value)) {
            return { records: [], errors: ['JSON content must be an array of row objects.'] };
        }
        const errors: string[] = [];
        const records: Array<Record<string, unknown>> = [];
        value.forEach((row, index) => {
            if (typeof row !== 'object' || row === null || Array.isArray(row)) {
                errors.push(`Row ${index + 1}: expected an object.`);
                records.push({});
                return;
            }
            records.push(row as Record<string, unknown>);
        });
        return { records, errors };
    } catch (error) {
        return {
            records: [],
            errors: [`JSON could not be parsed: ${error instanceof Error ? error.message : 'invalid content'}.`],
        };
    }
};

const parseCsvRows = (raw: string): { rows: string[][]; errors: string[] } => {
    const rows: string[][] = [];
    const errors: string[] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;
    let closedQuote = false;
    let line = 1;

    for (let index = 0; index < raw.length; index += 1) {
        const character = raw[index];
        if (quoted) {
            if (character === '"') {
                if (raw[index + 1] === '"') {
                    field += '"';
                    index += 1;
                } else {
                    quoted = false;
                    closedQuote = true;
                }
            } else {
                field += character;
                if (character === '\n') line += 1;
            }
            continue;
        }

        if (closedQuote && character !== ',' && character !== '\r' && character !== '\n') {
            errors.push(`CSV line ${line}: unexpected text after a closing quote.`);
            closedQuote = false;
        }
        if (character === '"' && field === '' && !closedQuote) {
            quoted = true;
        } else if (character === ',') {
            row.push(field);
            field = '';
            closedQuote = false;
        } else if (character === '\r' || character === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
            closedQuote = false;
            if (character === '\r' && raw[index + 1] === '\n') index += 1;
            line += 1;
        } else if (!closedQuote) {
            field += character;
        }
    }

    if (quoted) errors.push(`CSV line ${line}: quoted field is not closed.`);
    if (field !== '' || row.length > 0 || closedQuote) {
        row.push(field);
        rows.push(row);
    }

    return { rows, errors };
};

const parseCsv = (raw: string): { records: Array<Record<string, unknown>>; errors: string[] } => {
    const parsed = parseCsvRows(raw.replace(/^\uFEFF/, ''));
    if (parsed.rows.length === 0) return { records: [], errors: [...parsed.errors, 'CSV content is empty.'] };
    const [headers, ...rows] = parsed.rows;
    const errors = [...parsed.errors];
    const normalizedHeaders = new Set<string>();
    headers.forEach(header => {
        const normalized = header.toLowerCase();
        if (normalizedHeaders.has(normalized)) errors.push(`CSV header "${header}" is duplicated.`);
        normalizedHeaders.add(normalized);
    });

    const records = rows.map((values, rowIndex) => {
        if (values.length > headers.length) {
            errors.push(`Row ${rowIndex + 1}: contains more values than the CSV header.`);
        }
        return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    });
    return { records, errors };
};

const directChildren = (element: Element, tagName: string) => (
    Array.from(element.children).filter(child => child.tagName.toLowerCase() === tagName)
);

const parseXml = (raw: string): { records: Array<Record<string, unknown>>; errors: string[] } => {
    const document = new DOMParser().parseFromString(raw, 'application/xml');
    const parserError = document.querySelector('parsererror');
    if (parserError) return { records: [], errors: ['XML could not be parsed. Check that the document is valid.'] };
    const table = document.documentElement;
    const rowsElement = table.tagName.toLowerCase() === 'table'
        ? directChildren(table, 'rows')[0]
        : undefined;
    if (!rowsElement) {
        return { records: [], errors: ['XML must use the exported <table><rows> structure.'] };
    }

    const errors: string[] = [];
    const records = directChildren(rowsElement, 'row').map((row, rowIndex) => {
        const record: Record<string, unknown> = {};
        directChildren(row, 'field').forEach(field => {
            const name = field.getAttribute('name');
            if (!name) {
                errors.push(`Row ${rowIndex + 1}: a field is missing its name attribute.`);
                return;
            }
            if (name in record) {
                errors.push(`Row ${rowIndex + 1}, column "${name}": this field is duplicated.`);
                return;
            }
            record[name] = field.getAttribute('null') === 'true' ? null : field.textContent ?? '';
        });
        return record;
    });
    return { records, errors };
};

export const parseDataTableImport = (
    raw: string,
    fileName: string | null,
    columns: DataTableColumn[],
): DataTableImportResult => {
    if (!raw.trim()) return { format: null, totalRows: 0, rows: [], errors: [] };
    const format = detectFormat(raw, fileName);
    const parsed = format === 'json'
        ? parseJson(raw)
        : format === 'xml'
            ? parseXml(raw)
            : parseCsv(raw);
    const mapped = mapRecords(parsed.records, columns);
    return {
        format,
        totalRows: parsed.records.length,
        rows: mapped.rows,
        errors: [...parsed.errors, ...mapped.errors],
    };
};
