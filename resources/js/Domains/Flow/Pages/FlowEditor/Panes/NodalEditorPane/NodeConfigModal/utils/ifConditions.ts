import type { IfConditionCategory, IfConditionParameterValue, IfConditionRule, NodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { normalizeScalarParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/expression';
import { DATA_TYPE_ICONS } from '@/Shared/Utils/dataTypeIcons';

export type IfOperatorDef = { value: string; label: string; rightType?: 'text' | 'number' | 'dateTime' | 'boolean' };

const BASE_IF_OPERATORS: IfOperatorDef[] = [
    { value: 'exists', label: 'exists' },
    { value: 'doesNotExist', label: 'does not exist' },
    { value: 'isEmpty', label: 'is empty' },
    { value: 'isNotEmpty', label: 'is not empty' },
];

export const IF_OPERATORS: Record<IfConditionCategory, IfOperatorDef[]> = {
    string: [
        ...BASE_IF_OPERATORS,
        { value: 'equals', label: 'is equal to', rightType: 'text' },
        { value: 'notEquals', label: 'is not equal to', rightType: 'text' },
        { value: 'contains', label: 'contains', rightType: 'text' },
        { value: 'notContains', label: 'does not contain', rightType: 'text' },
        { value: 'startsWith', label: 'starts with', rightType: 'text' },
        { value: 'notStartsWith', label: 'does not start with', rightType: 'text' },
        { value: 'endsWith', label: 'ends with', rightType: 'text' },
        { value: 'notEndsWith', label: 'does not end with', rightType: 'text' },
        { value: 'matchesRegex', label: 'matches regex', rightType: 'text' },
        { value: 'notMatchesRegex', label: 'does not match regex', rightType: 'text' },
    ],
    number: [
        ...BASE_IF_OPERATORS,
        { value: 'equals', label: 'is equal to', rightType: 'number' },
        { value: 'notEquals', label: 'is not equal to', rightType: 'number' },
        { value: 'greaterThan', label: 'is greater than', rightType: 'number' },
        { value: 'lessThan', label: 'is less than', rightType: 'number' },
        { value: 'greaterThanOrEqual', label: 'is greater than or equal to', rightType: 'number' },
        { value: 'lessThanOrEqual', label: 'is less than or equal to', rightType: 'number' },
    ],
    dateTime: [
        ...BASE_IF_OPERATORS,
        { value: 'equals', label: 'is equal to', rightType: 'dateTime' },
        { value: 'notEquals', label: 'is not equal to', rightType: 'dateTime' },
        { value: 'after', label: 'is after', rightType: 'dateTime' },
        { value: 'before', label: 'is before', rightType: 'dateTime' },
        { value: 'afterOrEqual', label: 'is after or equal to', rightType: 'dateTime' },
        { value: 'beforeOrEqual', label: 'is before or equal to', rightType: 'dateTime' },
    ],
    boolean: [
        ...BASE_IF_OPERATORS,
        { value: 'isTrue', label: 'is true' },
        { value: 'isFalse', label: 'is false' },
        { value: 'equals', label: 'is equal to', rightType: 'boolean' },
        { value: 'notEquals', label: 'is not equal to', rightType: 'boolean' },
    ],
    array: [
        ...BASE_IF_OPERATORS,
        { value: 'contains', label: 'contains', rightType: 'text' },
        { value: 'notContains', label: 'does not contain', rightType: 'text' },
        { value: 'lengthEquals', label: 'length equal to', rightType: 'number' },
        { value: 'lengthNotEquals', label: 'length not equal to', rightType: 'number' },
        { value: 'lengthGreaterThan', label: 'length greater than', rightType: 'number' },
        { value: 'lengthLessThan', label: 'length less than', rightType: 'number' },
        { value: 'lengthGreaterThanOrEqual', label: 'length greater than or equal to', rightType: 'number' },
        { value: 'lengthLessThanOrEqual', label: 'length less than or equal to', rightType: 'number' },
    ],
    object: BASE_IF_OPERATORS,
};

export const IF_CATEGORY_LABELS: Record<IfConditionCategory, string> = {
    string: 'String',
    number: 'Number',
    dateTime: 'Date & Time',
    boolean: 'Boolean',
    array: 'Array',
    object: 'Object',
};

export const IF_CATEGORIES = Object.keys(IF_CATEGORY_LABELS) as IfConditionCategory[];

export const IF_CATEGORY_ICONS: Record<IfConditionCategory, string> = {
    string: DATA_TYPE_ICONS.string,
    number: DATA_TYPE_ICONS.number,
    dateTime: DATA_TYPE_ICONS.dateTime,
    boolean: DATA_TYPE_ICONS.boolean,
    array: DATA_TYPE_ICONS.array,
    object: DATA_TYPE_ICONS.object,
};

export function defaultIfRule(): IfConditionRule {
    return {
        id: `condition-${Date.now()}`,
        category: 'string',
        operator: 'exists',
        left: { mode: 'expression', value: '{{ $input.value }}' },
        right: { mode: 'fixed', value: '' },
    };
}

export function normalizeIfConditionValue(value: NodeParameterValue | undefined): IfConditionParameterValue {
    if (value?.mode === 'if-condition') return value;
    const scalar = normalizeScalarParameterValue(value);

    return {
        mode: 'if-condition',
        combinator: 'and',
        rules: scalar.value.trim()
            ? [{
                id: 'condition-1',
                category: 'boolean',
                operator: 'isTrue',
                left: scalar,
                right: { mode: 'fixed', value: '' },
            }]
            : [defaultIfRule()],
    };
}
