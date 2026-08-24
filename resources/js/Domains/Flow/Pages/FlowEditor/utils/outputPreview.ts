import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';

type NodalOutputSchema =
    | { type: 'array'; item?: NodalOutputSchema }
    | { type: 'object'; fields?: Record<string, NodalOutputSchema> }
    | { type: 'string' | 'number' | 'boolean' | 'unknown' | 'void' | 'date' | 'dateTime' | 'element' | 'httpResponse' };

export const unresolvedOutputPlaceholder = (label: string) => `[Needs run: ${label}]`;
export const unavailableOutputPlaceholder = '[Unavailable]';

const splitTopLevel = (value: string) => {
    const parts: string[] = [];
    let depth = 0;
    let start = 0;

    for (let index = 0; index < value.length; index += 1) {
        const char = value[index];
        if (char === '<' || char === '{' || char === '(') depth += 1;
        if (char === '>' || char === '}' || char === ')') depth = Math.max(0, depth - 1);
        if (char !== ',' || depth > 0) continue;

        parts.push(value.slice(start, index).trim());
        start = index + 1;
    }

    const lastPart = value.slice(start).trim();
    if (lastPart) parts.push(lastPart);
    return parts;
};

const parseFieldSchema = (value: string): Record<string, NodalOutputSchema> => {
    return Object.fromEntries(
        splitTopLevel(value).flatMap(field => {
            const separatorIndex = field.indexOf(':');
            if (separatorIndex === -1) return [];

            const key = field.slice(0, separatorIndex).trim().replace(/\?$/, '');
            const rawType = field.slice(separatorIndex + 1).trim();
            if (!key || !rawType) return [];

            const schema = parseNodalOutputSchema(rawType);
            return schema ? [[key, schema] as [string, NodalOutputSchema]] : [];
        }),
    );
};

export const parseNodalOutputSchema = (rawSpec: string | undefined): NodalOutputSchema | null => {
    if (!rawSpec) return null;

    const spec = rawSpec.trim();
    const normalized = spec.toLowerCase();
    const arrayMatch = spec.match(/^array(?:<([\s\S]+)>)?$/i);
    if (arrayMatch) {
        return {
            type: 'array',
            ...(arrayMatch[1]?.trim() ? { item: parseNodalOutputSchema(arrayMatch[1].trim()) ?? { type: 'unknown' } } : {}),
        };
    }

    const objectInlineMatch = spec.match(/^object\s*\{([\s\S]*)\}$/i);
    if (objectInlineMatch) {
        return { type: 'object', fields: parseFieldSchema(objectInlineMatch[1]) };
    }

    const objectMatch = spec.match(/^object(?:\s+([\s\S]+))?$/i);
    if (objectMatch) {
        return {
            type: 'object',
            ...(objectMatch[1]?.trim() ? { fields: parseFieldSchema(objectMatch[1]) } : {}),
        };
    }

    const primitiveTypes: Record<string, NodalOutputSchema['type']> = {
        string: 'string',
        number: 'number',
        boolean: 'boolean',
        unknown: 'unknown',
        void: 'void',
        date: 'date',
        datetime: 'dateTime',
        element: 'element',
        httpresponse: 'httpResponse',
    };
    if (primitiveTypes[normalized]) {
        return { type: primitiveTypes[normalized] };
    }

    return { type: 'unknown' };
};

const materializePreview = (schema: NodalOutputSchema, label: string): unknown => {
    if (schema.type === 'void') return undefined;
    if (schema.type === 'object') {
        const fields = schema.fields ?? {};
        if (Object.keys(fields).length === 0) return unresolvedOutputPlaceholder(label);

        return Object.fromEntries(
            Object.entries(fields).map(([key, fieldSchema]) => [key, materializePreview(fieldSchema, label)]),
        );
    }

    if (schema.type === 'array') {
        return [schema.item ? materializePreview(schema.item, label) : unresolvedOutputPlaceholder(label)];
    }

    return unresolvedOutputPlaceholder(label);
};

export const createNodalOutputPreview = (entry: Pick<HelpEntryDef, 'nodalOutput'> | null | undefined, label: string): unknown => {
    const schema = parseNodalOutputSchema(entry?.nodalOutput);
    return schema ? materializePreview(schema, label) : unresolvedOutputPlaceholder(label);
};

export const nodalOutputToTypeScript = (rawSpec: string | undefined): string => {
    const schema = parseNodalOutputSchema(rawSpec);
    if (!schema) return 'any';

    const toTs = (item: NodalOutputSchema): string => {
        if (item.type === 'array') return `${item.item ? toTs(item.item) : 'any'}[]`;
        if (item.type === 'object') {
            const fields = item.fields ?? {};
            if (Object.keys(fields).length === 0) return 'Record<string, any>';

            return `{ ${Object.entries(fields).map(([key, fieldSchema]) => `${JSON.stringify(key)}: ${toTs(fieldSchema)};`).join(' ')} }`;
        }
        if (item.type === 'void') return 'void';
        if (item.type === 'date') return 'Date';
        if (item.type === 'dateTime') return 'PuppetflowDateTime';
        if (item.type === 'element' || item.type === 'httpResponse' || item.type === 'unknown') return 'any';
        return item.type;
    };

    return toTs(schema);
};
