import type { NodalParamDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import type {
    IfConditionCategory,
    NodeParameterValue,
    ObjectFieldValueType,
    ObjectNodeParameterField,
    ObjectNodeParameterValue,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { normalizeParameterValue, normalizeScalarParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/expression';

export const OBJECT_INPUT_MODE_OPTIONS = [
    { value: 'json', label: 'JSON' },
    { value: 'form', label: 'Form' },
];

export const NESTED_OBJECT_FIELD_META: NodalParamDef = {
    label: 'Value',
    description: 'Nested object value.',
    input: 'custom-object',
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

export const isFunctionMap = (meta?: NodalParamDef) => (
    meta?.input === 'function-map' || meta?.valueType === 'function-map'
);

const parseJsonObject = (value: string): Record<string, unknown> | null => {
    try {
        const parsed = JSON.parse(value || '{}');
        return isRecord(parsed) ? parsed : null;
    } catch {
        return null;
    }
};

const normalizeJsonObjectText = (value: string) => {
    const parsed = parseJsonObject(value);
    return parsed ? JSON.stringify(parsed) : null;
};

const inferCustomFieldType = (value: unknown): IfConditionCategory => {
    if (Array.isArray(value)) return 'array';
    if (isRecord(value)) return 'object';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';

    return 'string';
};

const objectFieldValueType = (meta: NodalParamDef, key: string): ObjectFieldValueType | undefined => {
    const valueType = meta.objectFields?.[key]?.valueType;

    return ['string', 'number', 'dateTime', 'boolean', 'array', 'object', 'code'].includes(valueType ?? '')
        ? valueType as ObjectFieldValueType
        : undefined;
};

const isPureExpressionTemplate = (value: string) => /^\s*\{\{[\s\S]*\}\}\s*$/.test(value);

const hasExpressionTemplate = (value: string) => /\{\{[\s\S]*?\}\}/.test(value);

const parseFixedJsonValue = (value: string): unknown => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;

    if (/^[{[]/.test(trimmed)) {
        try {
            return JSON.parse(trimmed);
        } catch {
            return trimmed;
        }
    }

    return trimmed;
};

const fieldValueToJsonValue = (
    value: NodeParameterValue | undefined,
    meta?: NodalParamDef,
    valueType?: ObjectFieldValueType,
): unknown => {
    const normalized = normalizeParameterValue(value);
    if (normalized.mode === 'if-condition') return undefined;

    if (normalized.mode === 'object') {
        if (normalized.inputMode === 'json') {
            if (normalized.jsonMode === 'expression') return normalized.value;

            const parsed = parseJsonObject(normalized.value);
            return parsed ?? {};
        }

        return objectFieldsToJsonObject(normalized, meta ?? {
            description: '',
            input: 'custom-object',
            valueType: 'custom-object',
        });
    }

    if (normalized.mode === 'expression') return normalized.value;

    const scalarValue = normalized.value;
    if (hasExpressionTemplate(scalarValue)) return scalarValue;

    const effectiveType = valueType ?? meta?.valueType;

    switch (effectiveType) {
        case 'number': {
            const numberValue = Number(scalarValue);
            return Number.isFinite(numberValue) ? numberValue : scalarValue;
        }
        case 'boolean':
            return scalarValue === 'true' || scalarValue === '1';
        case 'array': {
            const parsed = parseFixedJsonValue(scalarValue);
            return Array.isArray(parsed) ? parsed : [];
        }
        case 'object':
        case 'custom-object': {
            const parsed = parseFixedJsonValue(scalarValue);
            return isRecord(parsed) ? parsed : {};
        }
        case 'dateTime':
        case 'string':
        default:
            return scalarValue;
    }
};

const jsonValueToNodeParameterValue = (value: unknown, meta?: NodalParamDef): NodeParameterValue => {
    if (isObjectInput(meta)) {
        if (isRecord(value)) {
            return {
                mode: 'object',
                inputMode: 'form',
                jsonMode: 'fixed',
                value: JSON.stringify(value, null, 2),
                fields: jsonObjectToFields(value, meta ?? {
                    description: '',
                    input: 'custom-object',
                    valueType: 'custom-object',
                }),
            };
        }

        return {
            mode: 'object',
            inputMode: 'json',
            jsonMode: 'fixed',
            value: JSON.stringify(value, null, 2),
            fields: [],
        };
    }

    if (typeof value === 'string') {
        return {
            mode: isPureExpressionTemplate(value) ? 'expression' : 'fixed',
            value: value,
        };
    }

    return {
        mode: 'fixed',
        value: value === undefined
            ? ''
            : isRecord(value) || Array.isArray(value)
                ? JSON.stringify(value, null, 2)
                : String(value),
    };
};

const jsonObjectToFields = (jsonObject: Record<string, unknown>, meta: NodalParamDef) => {
    const allowCustom = allowsCustomObjectFields(meta);
    const knownFields = meta.objectFields ?? {};

    return Object.entries(jsonObject)
        .flatMap(([key, value]) => {
            const fieldMeta = knownFields[key];
            if (fieldMeta?.valueType === 'flow') return [];
            if (!allowCustom && !fieldMeta) return [];
            const customField = allowCustom && !fieldMeta;
            const valueType = isFunctionMap(meta)
                ? 'code' as const
                : customField
                    ? inferCustomFieldType(value)
                    : objectFieldValueType(meta, key);

            return [{
                id: `${customField ? 'custom' : 'known'}-${key}`,
                key,
                valueType,
                value: jsonValueToNodeParameterValue(value, fieldMeta),
            }];
        });
};

const objectFieldsToJsonObject = (value: ObjectNodeParameterValue, meta: NodalParamDef) => {
    return Object.fromEntries(
        getObjectFields(value, meta)
            .map(field => [field.key.trim(), field] as const)
            .filter(([key]) => Boolean(key))
            .map(([key, field]) => [
                key,
                fieldValueToJsonValue(field.value, meta.objectFields?.[key], field.valueType),
            ]),
    );
};

const objectFieldsToJsonText = (value: ObjectNodeParameterValue, meta: NodalParamDef) => {
    return JSON.stringify(objectFieldsToJsonObject(value, meta), null, 2);
};

export function allowsCustomObjectFields(meta?: NodalParamDef) {
    return meta?.input === 'custom-object'
        || meta?.valueType === 'custom-object'
        || meta?.input === 'getter-map'
        || meta?.valueType === 'getter-map'
        || isFunctionMap(meta);
}

export function normalizeObjectParameterValue(value: NodeParameterValue | undefined, meta: NodalParamDef): ObjectNodeParameterValue {
    const normalized = normalizeParameterValue(value);
    if (normalized.mode === 'object') return normalized;
    const scalar = normalizeScalarParameterValue(normalized);

    return {
        mode: 'object',
        inputMode: Object.keys(meta.objectFields ?? {}).length > 0 || allowsCustomObjectFields(meta) ? 'form' : 'json',
        jsonMode: scalar.mode,
        value: scalar.value || '{}',
        fields: [],
    };
}

export function getObjectFields(value: ObjectNodeParameterValue, meta: NodalParamDef): ObjectNodeParameterField[] {
    const knownKeys = Object.keys(meta.objectFields ?? {});
    const allowCustom = allowsCustomObjectFields(meta);
    const validFields = (allowCustom
        ? value.fields.filter(field => meta.objectFields?.[field.key]?.valueType !== 'flow')
        : value.fields.filter(field => (
            field.key
            && knownKeys.includes(field.key)
            && meta.objectFields?.[field.key]?.valueType !== 'flow'
        )))
        .map(field => ({
            ...field,
            valueType: isFunctionMap(meta)
                ? 'code' as const
                : field.valueType ?? objectFieldValueType(meta, field.key),
        }));
    const requiredKeys = knownKeys.filter(key => (
        meta.objectFields?.[key]?.required
        && meta.objectFields?.[key]?.valueType !== 'flow'
    ));
    const preferredOneOfKeys = (meta.requiredOneOf ?? [])
        .filter(group => !group.some(key => validFields.some(field => field.key === key)))
        .map(group => group[0])
        .filter((key): key is string => Boolean(key));
    const missingFixedFields = [...new Set([...requiredKeys, ...preferredOneOfKeys])]
        .filter(key => !validFields.some(field => field.key === key))
        .map(key => ({
            id: `known-${key}`,
            key,
            valueType: objectFieldValueType(meta, key),
            value: createEmptyFieldValue(meta.objectFields?.[key]),
        }));

    return [
        ...missingFixedFields,
        ...validFields,
    ];
}

export function getAvailableObjectFieldKeys(fields: ObjectNodeParameterField[], meta: NodalParamDef) {
    return Object.keys(meta.objectFields ?? {})
        .filter(key => meta.objectFields?.[key]?.valueType !== 'flow')
        .filter(key => !fields.some(field => field.key === key));
}

export function getEffectiveObjectFieldMeta(
    meta: NodalParamDef | undefined,
    customField: boolean,
    valueType: ObjectFieldValueType,
) {
    return customField && valueType === 'object' ? NESTED_OBJECT_FIELD_META : meta;
}

export function getObjectFieldInputType(valueType: ObjectFieldValueType, meta?: NodalParamDef) {
    if (valueType === 'number') return 'number';
    if (valueType === 'boolean') return 'boolean';

    return getExpressionInputType(meta);
}

export function updateObjectField(
    value: ObjectNodeParameterValue,
    fields: ObjectNodeParameterField[],
    fieldId: string,
    patch: Partial<Pick<ObjectNodeParameterField, 'key' | 'valueType' | 'value'>>,
): ObjectNodeParameterValue {
    return {
        ...value,
        inputMode: 'form',
        fields: fields.map(field => field.id === fieldId ? { ...field, ...patch } : field),
    };
}

export function removeObjectField(
    value: ObjectNodeParameterValue,
    fields: ObjectNodeParameterField[],
    fieldId: string,
): ObjectNodeParameterValue {
    return {
        ...value,
        inputMode: 'form',
        fields: fields.filter(field => field.id !== fieldId),
    };
}

export function prependKnownObjectField(
    value: ObjectNodeParameterValue,
    fields: ObjectNodeParameterField[],
    meta: NodalParamDef,
    key: string,
): ObjectNodeParameterValue {
    return {
        ...value,
        inputMode: 'form',
        fields: [
            {
                id: `known-${key}`,
                key,
                valueType: objectFieldValueType(meta, key),
                value: createEmptyFieldValue(meta.objectFields?.[key]),
            },
            ...fields,
        ],
    };
}

export function prependCustomObjectField(
    value: ObjectNodeParameterValue,
    fields: ObjectNodeParameterField[],
    fieldId: string,
    meta?: NodalParamDef,
): ObjectNodeParameterValue {
    return {
        ...value,
        inputMode: 'form',
        fields: [
            {
                id: fieldId,
                key: '',
                valueType: isFunctionMap(meta) ? 'code' : 'string',
                value: createEmptyFieldValue(isFunctionMap(meta) ? {
                    description: 'JavaScript function.',
                    input: 'code',
                    valueType: 'function',
                } : undefined),
            },
            ...fields,
        ],
    };
}

export function getExpressionInputType(meta?: NodalParamDef): 'text' | 'textarea' | 'code' | 'boolean' | 'number' | 'select' | 'channel' | 'mailbox-watcher' {
    if (meta?.input === 'select' || meta?.input === 'tab-name' || (meta?.options?.length ?? 0) > 0) return 'select';
    if (meta?.input === 'boolean' || meta?.valueType === 'boolean') return 'boolean';
    if (meta?.input === 'number' || meta?.valueType === 'number') return 'number';
    if (meta?.input === 'textarea' || meta?.valueType === 'array') return 'textarea';
    if (meta?.input === 'code' || meta?.valueType === 'function' || meta?.valueType === 'code') return 'code';
    if (meta?.input === 'channel' || meta?.valueType === 'channel') return 'channel';
    if (meta?.input === 'mailbox-watcher' || meta?.valueType === 'mailbox-watcher') return 'mailbox-watcher';

    return 'text';
}

export function isObjectInput(meta?: NodalParamDef) {
    return meta?.input === 'object'
        || meta?.input === 'custom-object'
        || meta?.input === 'getter-map'
        || meta?.input === 'function-map'
        || meta?.valueType === 'object'
        || meta?.valueType === 'custom-object'
        || meta?.valueType === 'getter-map'
        || meta?.valueType === 'function-map'
        || Object.keys(meta?.objectFields ?? {}).length > 0;
}

export function createEmptyFieldValue(meta?: NodalParamDef): NodeParameterValue {
    if (isObjectInput(meta)) {
        const objectFields = meta?.objectFields ?? {};
        const requiredKeys = Object.entries(objectFields)
            .filter(([, fieldMeta]) => fieldMeta.required && fieldMeta.valueType !== 'flow')
            .map(([key]) => key);
        const preferredOneOfKeys = (meta?.requiredOneOf ?? [])
            .map(group => group[0])
            .filter((key): key is string => Boolean(key));

        return {
            mode: 'object',
            inputMode: Object.keys(objectFields).length > 0 || allowsCustomObjectFields(meta) ? 'form' : 'json',
            jsonMode: 'fixed',
            value: '{}',
            fields: [...new Set([...requiredKeys, ...preferredOneOfKeys])]
                .map(key => ({
                    id: `known-${key}`,
                    key,
                    value: createEmptyFieldValue(objectFields[key]),
                })),
        };
    }

    return { mode: 'fixed', value: meta?.defaultValue ?? (getExpressionInputType(meta) === 'boolean' ? 'false' : '') };
}

export function switchObjectInputMode(
    value: ObjectNodeParameterValue,
    meta: NodalParamDef,
    nextMode: ObjectNodeParameterValue['inputMode'],
): ObjectNodeParameterValue {
    if (nextMode === value.inputMode) return value;

    if (nextMode === 'json') {
        const jsonValue = objectFieldsToJsonText(value, meta);
        const jsonMode = hasExpressionTemplate(jsonValue) ? 'expression' : 'fixed';

        return {
            ...value,
            inputMode: 'json',
            jsonMode,
            value: jsonValue,
        };
    }

    const currentJson = normalizeJsonObjectText(value.value);
    const fieldsJson = normalizeJsonObjectText(objectFieldsToJsonText(value, meta));
    if (value.fields.length > 0 && currentJson && fieldsJson && currentJson === fieldsJson) {
        return {
            ...value,
            inputMode: 'form',
        };
    }

    const parsed = value.jsonMode === 'fixed' ? parseJsonObject(value.value) : null;

    return {
        ...value,
        inputMode: 'form',
        fields: parsed ? jsonObjectToFields(parsed, meta) : value.fields,
    };
}
