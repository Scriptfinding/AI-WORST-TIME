import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { NodeParameterValue, ScalarNodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { DataTableColumnType } from '@/Domains/DataTable/types';
import { COLUMN_TYPE_OPTIONS } from '@/Domains/DataTable/columnTypes';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import type { DataTableNodeResource } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/validation';
import { normalizeScalarParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/expression';
import ExpressionInput from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/ExpressionInput/ExpressionInput';
import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';
import * as Shared from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/shared.styled';
import * as S from './styled';

type DataTableColumn = DataTableNodeResource['columns'][number];
type StructuredKind = 'data-table-filters' | 'data-table-columns';

interface FilterRow {
    keyName: string;
    condition: string;
    keyValue?: unknown;
    keyValueMode?: 'fixed' | 'expression';
}

interface ColumnRow {
    name: string;
    type: DataTableColumnType;
    nameMode?: 'fixed' | 'expression';
}

interface Props {
    kind: StructuredKind;
    label: string;
    description: string;
    value: NodeParameterValue | undefined;
    columns: DataTableColumn[];
    outputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    flowId?: Id;
    readOnly?: boolean;
    invalid?: boolean;
    errorMessage?: string;
    onChange: (value: ScalarNodeParameterValue) => void;
}

const INPUT_MODE_OPTIONS = [
    { value: 'form', label: 'Form', icon: 'lucide:list-plus' },
    { value: 'json', label: 'JSON', icon: 'lucide:braces' },
];

const SYSTEM_COLUMNS: DataTableColumn[] = [
    { id: 'id', name: 'id', type: 'number' },
    { id: 'created_at', name: 'created_at', type: 'datetime' },
    { id: 'updated_at', name: 'updated_at', type: 'datetime' },
];

// Runtime operator vocabulary. Mirrors DataTableRowRepository::applyRuntimeCondition()
// in app/Services/DataTable/DataTableRowRepository.php; keep both in sync.
const FILTER_OPERATORS: Record<DataTableColumnType, Array<{ value: string; label: string }>> = {
    string: [
        { value: 'eq', label: 'Equals' },
        { value: 'neq', label: 'Does not equal' },
        { value: 'like', label: 'Contains (case-sensitive)' },
        { value: 'ilike', label: 'Contains (case-insensitive)' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' },
    ],
    number: [
        { value: 'eq', label: 'Equals' },
        { value: 'neq', label: 'Does not equal' },
        { value: 'gt', label: 'Greater than' },
        { value: 'gte', label: 'Greater than or equal' },
        { value: 'lt', label: 'Less than' },
        { value: 'lte', label: 'Less than or equal' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' },
    ],
    datetime: [
        { value: 'eq', label: 'Equals' },
        { value: 'neq', label: 'Does not equal' },
        { value: 'gt', label: 'After' },
        { value: 'gte', label: 'On or after' },
        { value: 'lt', label: 'Before' },
        { value: 'lte', label: 'On or before' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' },
    ],
    boolean: [
        { value: 'isTrue', label: 'Is true' },
        { value: 'isFalse', label: 'Is false' },
        { value: 'eq', label: 'Equals' },
        { value: 'neq', label: 'Does not equal' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' },
    ],
};

const VALUELESS_OPERATORS = ['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'];

// Rows hand-written in JSON mode carry no stored mode; detect expression templates.
const inferMode = (value: unknown, stored?: 'fixed' | 'expression'): 'fixed' | 'expression' => stored
    ?? (typeof value === 'string' && value.includes('{{') ? 'expression' : 'fixed');

const parseRows = <T,>(value: string): T[] => {
    try {
        const parsed: unknown = JSON.parse(value || '[]');
        return Array.isArray(parsed) ? parsed as T[] : [];
    } catch {
        return [];
    }
};

export default function DataTableStructuredInput({
    kind,
    label,
    description,
    value,
    columns,
    outputData,
    autocompleteContext,
    flowId,
    readOnly,
    invalid,
    errorMessage,
    onChange,
}: Props) {
    const scalarValue = normalizeScalarParameterValue(value);
    // The Form/JSON view is a pure presentation choice: fixed JSON text and
    // form rows share the same stored value, and JSON view supports both
    // fixed JSON and a dynamic expression via the editor's own toggle.
    const [view, setView] = useState<'form' | 'json'>(
        scalarValue.mode === 'expression' ? 'json' : 'form',
    );
    const allColumns = [...SYSTEM_COLUMNS, ...columns];
    const filters = parseRows<FilterRow>(scalarValue.value);
    const definitions = parseRows<ColumnRow>(scalarValue.value);
    const setRows = (rows: FilterRow[] | ColumnRow[]) => onChange({
        mode: 'fixed',
        value: JSON.stringify(rows),
    });

    const modeSelect = (
        <CustomSelect
            compact
            showOptionValue={false}
            value={view}
            disabled={readOnly}
            options={INPUT_MODE_OPTIONS}
            onChange={nextView => {
                if (nextView === view) return;
                if (nextView === 'json' && scalarValue.mode === 'fixed') {
                    const rows = kind === 'data-table-filters' ? filters : definitions;
                    const raw = scalarValue.value.trim();
                    onChange({
                        mode: 'fixed',
                        value: rows.length > 0
                            ? JSON.stringify(rows, null, 2)
                            : raw === '[]' ? '' : scalarValue.value,
                    });
                }
                setView(nextView === 'json' ? 'json' : 'form');
            }}
        />
    );

    return (
        <S.Root $invalid={invalid}>
            <S.Header>
                <div>
                    <label>{label}</label>
                    <S.Help>{description}</S.Help>
                    {invalid && (
                        <Shared.NodeFieldError>{errorMessage || 'This field is required.'}</Shared.NodeFieldError>
                    )}
                </div>
                {modeSelect}
            </S.Header>

            {view === 'json' ? (
                <ExpressionInput
                    label="JSON"
                    inputType="textarea"
                    placeholder={kind === 'data-table-filters'
                        ? '[{ "keyName": "status", "condition": "eq", "keyValue": "{{ $input.status }}" }]'
                        : '[{ "name": "status", "type": "string" }]'}
                    value={scalarValue}
                    outputData={outputData}
                    autocompleteContext={autocompleteContext}
                    flowId={flowId}
                    readOnly={readOnly}
                    onChange={onChange}
                />
            ) : kind === 'data-table-filters' ? (
                <FilterRows
                    rows={filters}
                    columns={allColumns}
                    outputData={outputData}
                    autocompleteContext={autocompleteContext}
                    flowId={flowId}
                    readOnly={readOnly}
                    onChange={setRows}
                />
            ) : (
                <ColumnRows
                    rows={definitions}
                    outputData={outputData}
                    autocompleteContext={autocompleteContext}
                    flowId={flowId}
                    readOnly={readOnly}
                    onChange={setRows}
                />
            )}
        </S.Root>
    );
}

function FilterRows({
    rows,
    columns,
    outputData,
    autocompleteContext,
    flowId,
    readOnly,
    onChange,
}: {
    rows: FilterRow[];
    columns: DataTableColumn[];
    outputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    flowId?: Id;
    readOnly?: boolean;
    onChange: (rows: FilterRow[]) => void;
}) {
    const columnOptions = columns.map(column => ({
        value: column.name,
        label: column.name,
        detail: column.type,
        icon: COLUMN_TYPE_OPTIONS.find(option => option.value === column.type)?.icon,
    }));
    const patch = (index: number, value: Partial<FilterRow>) => onChange(
        rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...value } : row),
    );

    return (
        <S.Rows>
            {rows.length === 0 && <S.Empty>No filters added.</S.Empty>}
            {rows.map((row, index) => {
                const column = columns.find(item => item.name === row.keyName) ?? columns[0];
                const type = column?.type ?? 'string';
                const operators = FILTER_OPERATORS[type];
                const condition = operators.some(option => option.value === row.condition)
                    ? row.condition
                    : operators[0].value;
                const needsValue = !VALUELESS_OPERATORS.includes(condition);

                return (
                    <S.FilterCard key={`${row.keyName}-${index}`}>
                        <S.FilterSelects>
                            <CustomSelect
                                value={column?.name ?? ''}
                                options={columnOptions}
                                disabled={readOnly}
                                placeholder="Column"
                                onChange={keyName => patch(index, {
                                    keyName,
                                    condition: FILTER_OPERATORS[
                                        columns.find(item => item.name === keyName)?.type ?? 'string'
                                    ][0].value,
                                    keyValue: null,
                                    keyValueMode: 'fixed',
                                })}
                            />
                            <CustomSelect
                                value={condition}
                                options={operators}
                                disabled={readOnly}
                                onChange={nextCondition => patch(index, {
                                    condition: nextCondition,
                                    ...VALUELESS_OPERATORS.includes(nextCondition)
                                        ? { keyValue: undefined }
                                        : {},
                                })}
                            />
                        </S.FilterSelects>
                        {needsValue && (
                            <FilterValueInput
                                type={type}
                                row={row}
                                outputData={outputData}
                                autocompleteContext={autocompleteContext}
                                flowId={flowId}
                                readOnly={readOnly}
                                onChange={(keyValue, keyValueMode) => patch(index, { keyValue, keyValueMode })}
                            />
                        )}
                        <S.CardRemoveButton
                            type="button"
                            disabled={readOnly}
                            title="Remove filter"
                            aria-label="Remove filter"
                            onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}
                        >
                            <Icon icon="lucide:trash-2" width={13} height={13} />
                        </S.CardRemoveButton>
                    </S.FilterCard>
                );
            })}
            <S.AddButton
                type="button"
                disabled={readOnly || columns.length === 0}
                onClick={() => {
                    const column = columns[0];
                    if (column) onChange([...rows, {
                        keyName: column.name,
                        condition: FILTER_OPERATORS[column.type][0].value,
                        keyValue: null,
                        keyValueMode: 'fixed',
                    }]);
                }}
            >
                <Icon icon="lucide:plus" width={13} height={13} />
                Add filter
            </S.AddButton>
        </S.Rows>
    );
}

function FilterValueInput({
    type,
    row,
    outputData,
    autocompleteContext,
    flowId,
    readOnly,
    onChange,
}: {
    type: DataTableColumnType;
    row: FilterRow;
    outputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    flowId?: Id;
    readOnly?: boolean;
    onChange: (keyValue: unknown, keyValueMode: 'fixed' | 'expression') => void;
}) {
    const scalar: ScalarNodeParameterValue = {
        mode: inferMode(row.keyValue, row.keyValueMode),
        value: row.keyValue === null || row.keyValue === undefined ? '' : String(row.keyValue),
    };
    const handleChange = (next: ScalarNodeParameterValue) => {
        if (next.mode === 'expression') {
            onChange(next.value, 'expression');
            return;
        }
        if (type === 'boolean') {
            onChange(next.value === 'null' || next.value === '' ? null : next.value === 'true', 'fixed');
            return;
        }
        if (type === 'number') {
            onChange(next.value === '' ? null : Number(next.value), 'fixed');
            return;
        }
        onChange(next.value, 'fixed');
    };

    return (
        <ExpressionInput
            label="Value"
            hint={null}
            inlineLabel
            inputType={type === 'number' ? 'number' : 'text'}
            placeholder="Comparison value"
            fixedInput={type === 'boolean' ? (
                <CustomSelect
                    value={scalar.value === '' ? 'null' : scalar.value}
                    disabled={readOnly}
                    options={[
                        { value: 'null', label: 'NULL' },
                        { value: 'true', label: 'TRUE' },
                        { value: 'false', label: 'FALSE' },
                    ]}
                    onChange={next => handleChange({ mode: 'fixed', value: next })}
                />
            ) : type === 'datetime' ? (
                <input
                    type="datetime-local"
                    value={scalar.value}
                    disabled={readOnly}
                    onChange={event => handleChange({ mode: 'fixed', value: event.target.value })}
                />
            ) : undefined}
            value={scalar}
            outputData={outputData}
            autocompleteContext={autocompleteContext}
            flowId={flowId}
            readOnly={readOnly}
            onChange={handleChange}
        />
    );
}

function ColumnRows({
    rows,
    outputData,
    autocompleteContext,
    flowId,
    readOnly,
    onChange,
}: {
    rows: ColumnRow[];
    outputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    flowId?: Id;
    readOnly?: boolean;
    onChange: (rows: ColumnRow[]) => void;
}) {
    const rowsRef = useRef<HTMLDivElement | null>(null);
    const pendingFocusIndexRef = useRef<number | null>(null);
    const patch = (index: number, value: Partial<ColumnRow>) => onChange(
        rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...value } : row),
    );

    useEffect(() => {
        const index = pendingFocusIndexRef.current;
        if (index === null) return;

        const frame = requestAnimationFrame(() => {
            rowsRef.current
                ?.querySelector<HTMLInputElement>(`[data-column-row="${index}"] input`)
                ?.focus();
            pendingFocusIndexRef.current = null;
        });

        return () => cancelAnimationFrame(frame);
    }, [rows.length]);

    return (
        <S.Rows $tight ref={rowsRef}>
            {rows.length === 0 && <S.Empty>No custom columns added.</S.Empty>}
            {rows.map((row, index) => (
                <S.ColumnRow key={index} data-column-row={index}>
                    <S.ColumnNameField>
                        <ExpressionInput
                            label="Name"
                            hint={null}
                            inlineLabel
                            inputType="text"
                            placeholder="column_name"
                            value={{ mode: inferMode(row.name, row.nameMode), value: row.name }}
                            outputData={outputData}
                            autocompleteContext={autocompleteContext}
                            flowId={flowId}
                            readOnly={readOnly}
                            onChange={next => patch(index, { name: next.value, nameMode: next.mode })}
                        />
                    </S.ColumnNameField>
                    <CustomSelect
                        value={row.type}
                        disabled={readOnly}
                        options={COLUMN_TYPE_OPTIONS}
                        showOptionValue={false}
                        onChange={type => patch(index, { type })}
                    />
                    <S.RemoveButton
                        type="button"
                        disabled={readOnly}
                        title="Remove column"
                        aria-label="Remove column"
                        onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}
                    >
                        <Icon icon="lucide:trash-2" width={13} height={13} />
                    </S.RemoveButton>
                </S.ColumnRow>
            ))}
            <S.AddButton
                type="button"
                disabled={readOnly}
                onClick={() => {
                    pendingFocusIndexRef.current = rows.length;
                    onChange([...rows, { name: '', type: 'string' }]);
                }}
            >
                <Icon icon="lucide:plus" width={13} height={13} />
                Add column
            </S.AddButton>
        </S.Rows>
    );
}
