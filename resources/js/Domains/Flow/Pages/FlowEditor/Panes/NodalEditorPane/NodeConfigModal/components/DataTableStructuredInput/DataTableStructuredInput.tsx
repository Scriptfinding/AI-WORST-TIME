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
    { value: 'fixed', label: 'Form', icon: 'lucide:list-plus' },
    { value: 'expression', label: 'Expression', icon: 'lucide:braces' },
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
    const allColumns = [...SYSTEM_COLUMNS, ...columns];
    const filters = parseRows<FilterRow>(scalarValue.value);
    const definitions = parseRows<ColumnRow>(scalarValue.value);
    const setRows = (rows: FilterRow[] | ColumnRow[]) => onChange({
        mode: 'fixed',
        value: JSON.stringify(rows),
    });

    if (scalarValue.mode === 'expression') {
        return (
            <ExpressionInput
                label={label}
                hint={description}
                inputType="textarea"
                placeholder={kind === 'data-table-filters'
                    ? '{{ $input.filters }}'
                    : '{{ $input.columns }}'}
                value={scalarValue}
                outputData={outputData}
                autocompleteContext={autocompleteContext}
                flowId={flowId}
                readOnly={readOnly}
                invalid={invalid}
                errorMessage={errorMessage}
                onChange={onChange}
            />
        );
    }

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
                <CustomSelect
                    compact
                    showOptionValue={false}
                    value="fixed"
                    disabled={readOnly}
                    options={INPUT_MODE_OPTIONS}
                    onChange={mode => {
                        if (mode === 'expression') onChange({ mode, value: '' });
                    }}
                />
            </S.Header>

            {kind === 'data-table-filters' ? (
                <FilterRows
                    rows={filters}
                    columns={allColumns}
                    readOnly={readOnly}
                    onChange={setRows}
                />
            ) : (
                <ColumnRows
                    rows={definitions}
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
    readOnly,
    onChange,
}: {
    rows: FilterRow[];
    columns: DataTableColumn[];
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
                    <S.Row key={`${row.keyName}-${index}`}>
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
                        {needsValue ? (
                            <FilterValueInput
                                type={type}
                                value={row.keyValue}
                                mode={row.keyValueMode ?? 'fixed'}
                                readOnly={readOnly}
                                onChange={(keyValue, keyValueMode) => patch(index, { keyValue, keyValueMode })}
                            />
                        ) : <span />}
                        <S.RemoveButton
                            type="button"
                            disabled={readOnly}
                            aria-label="Remove filter"
                            onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}
                        >
                            <Icon icon="lucide:trash-2" width={14} height={14} />
                        </S.RemoveButton>
                    </S.Row>
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
    value,
    mode,
    readOnly,
    onChange,
}: {
    type: DataTableColumnType;
    value: unknown;
    mode: 'fixed' | 'expression';
    readOnly?: boolean;
    onChange: (value: unknown, mode: 'fixed' | 'expression') => void;
}) {
    const modeSelect = (
        <CustomSelect
            compact
            value={mode}
            disabled={readOnly}
            showOptionValue={false}
            dropdownMinWidth={150}
            options={[
                { value: 'fixed', label: 'Fixed value', icon: 'lucide:text-cursor-input' },
                { value: 'expression', label: 'Expression', icon: 'lucide:braces' },
            ]}
            onChange={nextMode => onChange(value, nextMode)}
        />
    );

    if (mode === 'expression') {
        return (
            <S.ValueField>
                <S.Input
                    value={value === null || value === undefined ? '' : String(value)}
                    disabled={readOnly}
                    placeholder="{{ $input.value }}"
                    onChange={event => onChange(event.target.value, mode)}
                />
                {modeSelect}
            </S.ValueField>
        );
    }

    if (type === 'boolean') {
        const encoded = value === null || value === undefined ? 'null' : String(value);
        return (
            <S.ValueField>
                <CustomSelect
                    value={encoded}
                    disabled={readOnly}
                    options={[
                        { value: 'null', label: 'NULL' },
                        { value: 'true', label: 'TRUE' },
                        { value: 'false', label: 'FALSE' },
                    ]}
                    onChange={next => onChange(next === 'null' ? null : next === 'true', mode)}
                />
                {modeSelect}
            </S.ValueField>
        );
    }

    return (
        <S.ValueField>
            <S.Input
                type={type === 'number' ? 'number' : type === 'datetime' ? 'datetime-local' : 'text'}
                value={value === null || value === undefined ? '' : String(value)}
                disabled={readOnly}
                placeholder="Comparison value"
                onChange={event => onChange(
                    type === 'number'
                        ? event.target.value === '' ? null : Number(event.target.value)
                        : event.target.value,
                    mode,
                )}
            />
            {modeSelect}
        </S.ValueField>
    );
}

function ColumnRows({
    rows,
    readOnly,
    onChange,
}: {
    rows: ColumnRow[];
    readOnly?: boolean;
    onChange: (rows: ColumnRow[]) => void;
}) {
    const patch = (index: number, value: Partial<ColumnRow>) => onChange(
        rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...value } : row),
    );

    return (
        <S.Rows>
            {rows.length === 0 && <S.Empty>No custom columns added.</S.Empty>}
            {rows.map((row, index) => (
                <S.ColumnRow key={index}>
                    <S.Input
                        value={row.name}
                        disabled={readOnly}
                        placeholder="column_name"
                        onChange={event => patch(index, { name: event.target.value })}
                    />
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
                        aria-label="Remove column"
                        onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}
                    >
                        <Icon icon="lucide:trash-2" width={14} height={14} />
                    </S.RemoveButton>
                </S.ColumnRow>
            ))}
            <S.AddButton
                type="button"
                disabled={readOnly}
                onClick={() => onChange([...rows, { name: '', type: 'string' }])}
            >
                <Icon icon="lucide:plus" width={13} height={13} />
                Add column
            </S.AddButton>
        </S.Rows>
    );
}
