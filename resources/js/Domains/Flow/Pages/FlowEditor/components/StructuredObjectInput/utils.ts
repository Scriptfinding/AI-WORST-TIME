import {
    formatResourceReference,
    isReferenceInputType,
    parseResourceReference,
    type ResourceFlowInputType,
} from '@/Domains/Flow/Utils/flowInputsMetadata';

export type InputMode = 'json' | 'form';
export type ResourceFieldValueType = ResourceFlowInputType;
export type FieldValueType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'object'
    | 'array'
    | 'null'
    | 'variable'
    | ResourceFieldValueType;
export type FieldCollectionType = 'object' | 'array';

export interface FormField {
    id: string;
    key: string;
    value: string;
    valueType: FieldValueType;
}

export interface StructuredFieldDefinition {
    name: string;
    type: Exclude<FieldValueType, 'variable'>;
    default?: unknown;
}

const VARIABLE_REFERENCE_PATTERN = /^\$\{vars(?:\.([a-zA-Z0-9_.-]+))?\}$/;

const valueTypeFromValue = (value: unknown): FieldValueType => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string' && VARIABLE_REFERENCE_PATTERN.test(value)) return 'variable';
    const resourceReference = parseResourceReference(value);
    if (resourceReference) return resourceReference.type;
    return 'string';
};

const getVariableKeyFromReference = (value: unknown) => {
    if (typeof value !== 'string') return null;
    const match = value.match(VARIABLE_REFERENCE_PATTERN);
    return match ? (match[1] ?? '') : null;
};

const fieldValueFromValue = (value: unknown) => {
    const variableKey = getVariableKeyFromReference(value);
    if (variableKey !== null) return variableKey;
    const resourceReference = parseResourceReference(value);
    if (resourceReference) return resourceReference.key;
    if (value === null) return '';
    if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

export const fieldsFromCollection = (raw: string, collectionType: FieldCollectionType): FormField[] => {
    try {
        const parsed = JSON.parse(raw || (collectionType === 'array' ? '[]' : '{}'));
        const collection = collectionType === 'array'
            ? (Array.isArray(parsed) ? parsed : [])
            : (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {});

        return Object.entries(collection).map(([key, value], index) => ({
            id: `field-${index}`,
            key,
            value: fieldValueFromValue(value),
            valueType: valueTypeFromValue(value),
        }));
    } catch {
        return [];
    }
};

export const fieldsFromObject = (raw: string): FormField[] => (
    fieldsFromCollection(raw, 'object')
);

export const fieldsFromDefinitions = (raw: string, definitions: StructuredFieldDefinition[]): FormField[] => {
    let values: Record<string, unknown> = {};
    try {
        const parsed = JSON.parse(raw || '{}');
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) values = parsed;
    } catch {
        // Invalid JSON is represented by blueprint defaults until the next valid edit.
    }

    const definitionsByName = new Map(definitions.map(definition => [definition.name, definition]));
    const serializedDefinitionNames = Object.keys(values).filter(name => definitionsByName.has(name));
    const serializedDefinitionNameSet = new Set(serializedDefinitionNames);
    const orderedDefinitions = [
        ...serializedDefinitionNames.map(name => definitionsByName.get(name)!),
        ...definitions.filter(definition => !serializedDefinitionNameSet.has(definition.name)),
    ];

    return orderedDefinitions.map((definition, index) => {
        const value = Object.prototype.hasOwnProperty.call(values, definition.name)
            ? values[definition.name]
            : definition.default;

        return {
            id: `${definition.name}-${index}`,
            key: definition.name,
            value: fieldValueFromValue(value),
            valueType: valueTypeFromValue(value) === 'variable' ? 'variable' : definition.type,
        };
    });
};

const valueFromField = (field: FormField): unknown => {
    if (field.valueType === 'number') {
        const numericValue = Number(field.value);
        return Number.isFinite(numericValue) ? numericValue : 0;
    }
    if (field.valueType === 'boolean') return field.value === 'true';
    if (field.valueType === 'null') return null;
    if (field.valueType === 'variable') return `\${vars${field.value ? `.${field.value}` : ''}}`;
    if (isReferenceInputType(field.valueType)) {
        return formatResourceReference(field.valueType, field.value);
    }
    if (field.valueType === 'array' || field.valueType === 'object') {
        try {
            const parsed = JSON.parse(field.value || (field.valueType === 'array' ? '[]' : '{}'));
            if (field.valueType === 'array' && Array.isArray(parsed)) return parsed;
            if (field.valueType === 'object' && parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
        } catch {
            // Fall back to an empty collection below.
        }
        return field.valueType === 'array' ? [] : {};
    }
    return field.value;
};

export const stringifyCollectionFields = (fields: FormField[], collectionType: FieldCollectionType) => {
    if (collectionType === 'array') {
        return JSON.stringify(fields.map(valueFromField), null, 2);
    }

    const result = fields.reduce<Record<string, unknown>>((accumulator, field) => {
        const key = field.key.trim();
        if (key) accumulator[key] = valueFromField(field);
        return accumulator;
    }, {});

    return JSON.stringify(result, null, 2);
};

export const stringifyFields = (fields: FormField[]) => stringifyCollectionFields(fields, 'object');

export const readStoredInputMode = (storageKey: string): InputMode => {
    if (typeof window === 'undefined') return 'form';
    return window.localStorage.getItem(storageKey) === 'json' ? 'json' : 'form';
};
