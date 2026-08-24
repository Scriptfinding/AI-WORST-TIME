export type FlowInputType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'array'
    | 'object'
    | 'null'
    | 'channel'
    | 'mailbox-watcher'
    | 'ai-model';

export interface FlowInputDefinition {
    name: string;
    type: FlowInputType;
    default?: unknown;
}

export type ResourceFlowInputType = Extract<FlowInputType, 'channel' | 'mailbox-watcher' | 'ai-model'>;

const INPUT_NAME = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
const RESOURCE_REFERENCE_PATTERN = /^\$\{(channels|mailboxWatchers|aiModels)(?:\.([a-zA-Z0-9_.-]+))?\}$/;
const RESOURCE_TYPE_BY_NAMESPACE: Record<string, ResourceFlowInputType> = {
    channels: 'channel',
    mailboxWatchers: 'mailbox-watcher',
    aiModels: 'ai-model',
};
const RESOURCE_NAMESPACE_BY_TYPE: Record<ResourceFlowInputType, string> = {
    channel: 'channels',
    'mailbox-watcher': 'mailboxWatchers',
    'ai-model': 'aiModels',
};
const REFERENCE_INPUT_TYPES = new Set<string>(Object.keys(RESOURCE_NAMESPACE_BY_TYPE));
const INPUT_TYPES = new Set<string>([
    'string',
    'number',
    'boolean',
    'array',
    'object',
    'null',
    ...REFERENCE_INPUT_TYPES,
]);

export const isReferenceInputType = (type: string): type is ResourceFlowInputType => (
    REFERENCE_INPUT_TYPES.has(type)
);

export const parseResourceReference = (value: unknown) => {
    if (typeof value !== 'string') return null;
    const match = value.match(RESOURCE_REFERENCE_PATTERN);
    if (!match) return null;

    return { type: RESOURCE_TYPE_BY_NAMESPACE[match[1]], key: match[2] ?? '' };
};

export const formatResourceReference = (type: ResourceFlowInputType, key: string) => (
    `\${${RESOURCE_NAMESPACE_BY_TYPE[type]}${key ? `.${key}` : ''}}`
);

function parseDefaultValue(type: FlowInputType, source: string, lineNumber: number): unknown {
    const value = source.trim();

    if (type === 'string' || isReferenceInputType(type)) {
        if (!value.startsWith('"')) return value;
        try {
            const parsed = JSON.parse(value);
            if (typeof parsed === 'string') return parsed;
        } catch {
            // Report the common validation error below.
        }
    } else if (type === 'number') {
        const parsed = Number(value);
        if (value !== '' && Number.isFinite(parsed)) return parsed;
    } else if (type === 'boolean') {
        if (value === 'true') return true;
        if (value === 'false') return false;
    } else if (type === 'null') {
        if (value === 'null') return null;
    } else {
        try {
            const parsed = JSON.parse(value);
            if (type === 'array' && Array.isArray(parsed)) return parsed;
            if (type === 'object' && parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
        } catch {
            // Report the common validation error below.
        }
    }

    throw new Error(`Invalid default value for @input on line ${lineNumber}.`);
}

export function parseCodeInputDefinitions(code: string): FlowInputDefinition[] {
    const definitions = new Map<string, FlowInputDefinition>();
    const lines = code.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index].trim();
        if (!line) continue;
        if (!line.startsWith('//')) break;
        if (!/^\/\/\s*@input\b/i.test(line)) continue;

        const match = line.match(/^\/\/\s*@input\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+\[([a-z-]+)\](?:\s*:\s*(.*))?$/i);
        if (!match) {
            throw new Error(`Invalid @input declaration on line ${index + 1}. Use "@input name [type]: default".`);
        }

        const [, name, rawType, rawDefault] = match;
        const type = rawType.toLowerCase() as FlowInputType;
        if (!INPUT_NAME.test(name) || !INPUT_TYPES.has(type)) {
            throw new Error(`Invalid @input name or type on line ${index + 1}.`);
        }

        definitions.set(name, {
            name,
            type,
            ...(rawDefault === undefined || rawDefault.trim() === ''
                ? {}
                : { default: parseDefaultValue(type, rawDefault, index + 1) }),
        });
    }

    return [...definitions.values()];
}

export function parseNodalInputDefinitions(metadata: unknown): FlowInputDefinition[] {
    if (!metadata || typeof metadata !== 'object') return [];
    const inputs = (metadata as { inputs?: unknown }).inputs;
    if (!Array.isArray(inputs)) return [];

    return inputs.flatMap(input => {
        if (!input || typeof input !== 'object') return [];
        const candidate = input as { name?: unknown; type?: unknown; default?: unknown };
        if (
            typeof candidate.name !== 'string'
            || !INPUT_NAME.test(candidate.name)
            || typeof candidate.type !== 'string'
            || !INPUT_TYPES.has(candidate.type as FlowInputType)
        ) {
            return [];
        }

        return [{
            name: candidate.name,
            type: candidate.type as FlowInputType,
            ...(Object.prototype.hasOwnProperty.call(candidate, 'default') ? { default: candidate.default } : {}),
        }];
    });
}

export function inputDefinitionsToDefaults(definitions: FlowInputDefinition[]) {
    return Object.fromEntries(definitions.map(definition => [
        definition.name,
        Object.prototype.hasOwnProperty.call(definition, 'default')
            ? definition.default
            : isReferenceInputType(definition.type)
                ? formatResourceReference(definition.type, '')
                : definition.type === 'string'
                ? ''
                : null,
    ]));
}

export function inputDefinitionsFromDefaults(inputs: Record<string, unknown> | null): FlowInputDefinition[] {
    return Object.entries(inputs ?? {}).map(([name, value]) => {
        const resourceReference = parseResourceReference(value);

        return {
            name,
            type: resourceReference
                ? resourceReference.type
                : Array.isArray(value)
            ? 'array'
            : value === null
                ? 'null'
                : typeof value === 'object'
                    ? 'object'
                    : typeof value === 'number'
                        ? 'number'
                        : typeof value === 'boolean'
                            ? 'boolean'
                            : 'string',
            default: value,
        };
    });
}

export function formatCodeInputDefinition(definition: FlowInputDefinition) {
    const prefix = `// @input ${definition.name} [${definition.type}]`;
    if (!Object.prototype.hasOwnProperty.call(definition, 'default')) return prefix;

    return `${prefix}: ${JSON.stringify(definition.default)}`;
}
