import { DATA_TYPE_ICONS } from '@/Shared/Utils/dataTypeIcons';
import {
    fieldsFromCollection,
    stringifyCollectionFields,
    type FieldCollectionType,
    type FieldValueType,
    type FormField,
} from '@/Domains/Flow/Pages/FlowEditor/components/StructuredObjectInput/utils';

export interface NestedLevel {
    index: number;
    label: string;
    type: FieldCollectionType;
}

const TYPE_LABELS: Record<Exclude<FieldValueType, 'variable'>, string> = {
    string: 'Text',
    number: 'Number',
    boolean: 'Boolean',
    object: 'Object',
    array: 'Array',
    null: 'Null',
    channel: 'Messenger Channel',
    'mailbox-watcher': 'Mailbox Watcher',
    'ai-model': 'AI Model',
    datatable: 'Data Table',
};

export function fieldTypeOptions(
    lockedType: Exclude<FieldValueType, 'variable'> | undefined,
    allowCollections: boolean,
    allowResources: boolean,
) {
    const types: FieldValueType[] = lockedType
        ? [lockedType, 'variable']
        : [
            'string',
            'number',
            'boolean',
            'variable',
            ...(allowResources ? ['channel', 'mailbox-watcher', 'ai-model', 'datatable'] as const : []),
            ...(allowCollections ? ['object', 'array'] as const : []),
            'null',
        ];

    return types.map(type => ({
        value: type,
        label: type === 'variable' ? 'Variable' : TYPE_LABELS[type],
        icon: DATA_TYPE_ICONS[type],
    }));
}

export function nestedFieldsAtPath(fields: FormField[], path: NestedLevel[]) {
    let currentFields = fields;
    let field: FormField | undefined;
    for (const level of path) {
        field = currentFields[level.index];
        if (!field || (field.valueType !== 'object' && field.valueType !== 'array')) return null;
        currentFields = fieldsFromCollection(field.value, field.valueType);
    }

    return field ? { field, fields: currentFields } : null;
}

export function updateNestedFieldsAtPath(
    fields: FormField[],
    path: NestedLevel[],
    nestedFields: FormField[],
): FormField[] {
    const [level, ...remainingPath] = path;
    if (!level) return fields;

    return fields.map((field, index) => {
        if (index !== level.index || (field.valueType !== 'object' && field.valueType !== 'array')) return field;
        const nextFields = remainingPath.length === 0
            ? nestedFields
            : updateNestedFieldsAtPath(
                fieldsFromCollection(field.value, field.valueType),
                remainingPath,
                nestedFields,
            );

        return {
            ...field,
            value: stringifyCollectionFields(nextFields, field.valueType),
        };
    });
}

export function nestedValueSummary(field: FormField) {
    try {
        const value = JSON.parse(field.value);
        const count = Array.isArray(value)
            ? value.length
            : value && typeof value === 'object'
                ? Object.keys(value).length
                : 0;
        const itemLabel = field.valueType === 'array' ? 'item' : 'field';
        return `${count} ${itemLabel}${count === 1 ? '' : 's'}`;
    } catch {
        return field.valueType === 'array' ? 'Empty array' : 'Empty object';
    }
}

export function nestedValueIsEmpty(field: FormField) {
    try {
        const value = JSON.parse(field.value);
        return Array.isArray(value)
            ? value.length === 0
            : !value || typeof value !== 'object' || Object.keys(value).length === 0;
    } catch {
        return true;
    }
}

export function convertCollectionValue(
    value: string,
    from: FieldCollectionType,
    to: FieldCollectionType,
) {
    if (from === to) return value;

    try {
        const parsed = JSON.parse(value);
        if (from === 'object' && to === 'array' && parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return JSON.stringify(Object.values(parsed), null, 2);
        }
        if (from === 'array' && to === 'object' && Array.isArray(parsed)) {
            return JSON.stringify(
                Object.fromEntries(parsed.map((item, index) => [String(index), item])),
                null,
                2,
            );
        }
    } catch {
        // Fall through to an empty collection of the requested type.
    }

    return to === 'array' ? '[]' : '{}';
}

export function reorderFields(
    fields: FormField[],
    draggedFieldId: string,
    targetFieldId: string,
    position: 'before' | 'after',
) {
    if (draggedFieldId === targetFieldId) return null;
    const sourceIndex = fields.findIndex(field => field.id === draggedFieldId);
    if (sourceIndex < 0) return null;

    const nextFields = [...fields];
    const [draggedField] = nextFields.splice(sourceIndex, 1);
    if (!draggedField) return null;
    const targetIndex = nextFields.findIndex(field => field.id === targetFieldId);
    if (targetIndex < 0) return null;
    nextFields.splice(position === 'before' ? targetIndex : targetIndex + 1, 0, draggedField);
    return nextFields;
}
