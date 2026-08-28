import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/Shared/UI/Button/Button';
import { Icon } from '@/Shared/UI/Icon/Icon';
import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';
import { IF_OPERATORS } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/utils/ifConditions';
import type { IfConditionCategory } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { DataTableColumn, DataTableFilter } from '../types';
import * as S from './styled';

interface Props {
    column: DataTableColumn;
    filter?: DataTableFilter;
    onApply: (filter: DataTableFilter) => void;
    onClear: () => void;
}

// UI operator vocabulary. Mirrors DataTableRowRepository::filterOperators()
// in app/Services/DataTable/DataTableRowRepository.php; keep both in sync.
const FILTER_OPERATORS: Record<DataTableColumn['type'], string[]> = {
    string: [
        'exists',
        'doesNotExist',
        'isEmpty',
        'isNotEmpty',
        'equals',
        'notEquals',
        'contains',
        'notContains',
        'startsWith',
        'notStartsWith',
        'endsWith',
        'notEndsWith',
    ],
    number: [
        'exists',
        'doesNotExist',
        'isEmpty',
        'isNotEmpty',
        'equals',
        'notEquals',
        'greaterThan',
        'lessThan',
        'greaterThanOrEqual',
        'lessThanOrEqual',
    ],
    datetime: [
        'exists',
        'doesNotExist',
        'isEmpty',
        'isNotEmpty',
        'equals',
        'notEquals',
        'after',
        'before',
        'afterOrEqual',
        'beforeOrEqual',
    ],
    boolean: [
        'exists',
        'doesNotExist',
        'isEmpty',
        'isNotEmpty',
        'isTrue',
        'isFalse',
    ],
};

const DEFAULT_OPERATOR: Record<DataTableColumn['type'], string> = {
    string: 'contains',
    number: 'equals',
    datetime: 'equals',
    boolean: 'isTrue',
};

const categoryFor = (type: DataTableColumn['type']): IfConditionCategory => (
    type === 'datetime' ? 'dateTime' : type
);

export default function DataTableColumnFilter({ column, filter, onApply, onClear }: Props) {
    const [open, setOpen] = useState(false);
    const [operator, setOperator] = useState(filter?.operator ?? DEFAULT_OPERATOR[column.type]);
    const [value, setValue] = useState(filter?.value ?? '');
    const rootRef = useRef<HTMLSpanElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const operators = useMemo(() => {
        const allowed = FILTER_OPERATORS[column.type];
        return IF_OPERATORS[categoryFor(column.type)].filter(item => allowed.includes(item.value));
    }, [column.type]);
    const selectedOperator = operators.find(item => item.value === operator) ?? operators[0];

    useEffect(() => {
        if (!open) return;
        const dismiss = (event: MouseEvent) => {
            if ((event.target as Element).closest?.('[data-node-field-dropdown="true"]')) return;
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        const handleKeyDown = (event: KeyboardEvent) => {
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

    const resetDraft = () => {
        setOperator(filter?.operator ?? DEFAULT_OPERATOR[column.type]);
        setValue(filter?.value ?? '');
    };
    const close = () => {
        setOpen(false);
        resetDraft();
    };
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const next: DataTableFilter = {
            column_id: column.id,
            operator: selectedOperator.value,
        };
        if (selectedOperator.rightType) next.value = value;
        onApply(next);
        setOpen(false);
    };

    return (
        <S.ColumnFilterRoot ref={rootRef}>
            <S.TinyAction
                ref={triggerRef}
                type="button"
                title={filter ? `Filter active: ${selectedOperator.label}` : 'Filter column'}
                aria-label={`Filter ${column.name}`}
                aria-haspopup="dialog"
                aria-expanded={open}
                $active={Boolean(filter)}
                onClick={() => {
                    if (open) {
                        close();
                    } else {
                        resetDraft();
                        setOpen(true);
                    }
                }}
            >
                <Icon icon="lucide:filter" width={12} />
            </S.TinyAction>
            {open && (
                <S.ColumnFilterPopover role="dialog" aria-label={`Filter ${column.name}`}>
                    <S.ColumnFilterTitle>
                        <Icon icon="lucide:filter" width={13} />
                        Filter {column.name}
                    </S.ColumnFilterTitle>
                    <S.ColumnFilterForm onSubmit={submit}>
                        <S.ColumnFilterField>
                            <S.ColumnFilterLabel>Condition</S.ColumnFilterLabel>
                            <CustomSelect<string>
                                value={selectedOperator.value}
                                options={operators.map(item => ({
                                    value: item.value,
                                    label: item.label,
                                }))}
                                compact
                                compactHeight={32}
                                dropdownMinWidth={230}
                                searchThreshold={8}
                                showOptionValue={false}
                                ariaLabel="Filter condition"
                                onChange={nextOperator => {
                                    setOperator(nextOperator);
                                    setValue('');
                                }}
                            />
                        </S.ColumnFilterField>
                        {selectedOperator.rightType && (
                            <S.ColumnFilterField>
                                <S.ColumnFilterLabel>Value</S.ColumnFilterLabel>
                                <S.ColumnFilterInput
                                    autoFocus
                                    type={selectedOperator.rightType === 'number'
                                        ? 'number'
                                        : selectedOperator.rightType === 'dateTime'
                                            ? 'datetime-local'
                                            : 'text'}
                                    value={value}
                                    onChange={event => setValue(event.target.value)}
                                    placeholder="Comparison value"
                                />
                            </S.ColumnFilterField>
                        )}
                        <S.ColumnFilterActions>
                            {filter && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    type="button"
                                    onClick={() => {
                                        onClear();
                                        setOpen(false);
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                            <Button
                                size="sm"
                                type="submit"
                                disabled={Boolean(selectedOperator.rightType) && value === ''}
                            >
                                Apply
                            </Button>
                        </S.ColumnFilterActions>
                    </S.ColumnFilterForm>
                </S.ColumnFilterPopover>
            )}
        </S.ColumnFilterRoot>
    );
}
