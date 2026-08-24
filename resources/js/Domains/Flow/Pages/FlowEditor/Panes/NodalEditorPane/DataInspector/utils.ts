import { unavailableOutputPlaceholder } from '@/Domains/Flow/Pages/FlowEditor/utils/outputPreview';

export interface InspectorTreeRow {
    key: string;
    path: string;
    type: string;
    depth: number;
    value?: unknown;
}

export interface ContainerEntry {
    key: string;
    path: string;
    value: unknown;
}

export const MAX_ARRAY_ITEMS = 50;
export const MAX_OBJECT_ENTRIES = 100;

export const valueType = (value: unknown): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
};

export const appendPath = (root: string, segment: string | number) => {
    if (!root || root === '$') return typeof segment === 'number' ? `[${segment}]` : String(segment);
    if (typeof segment === 'number') return `${root}[${segment}]`;
    return /^[a-zA-Z_$][\w$]*$/.test(segment)
        ? `${root}.${segment}`
        : `${root}[${JSON.stringify(segment)}]`;
};

export const formatPrimitive = (value: unknown) => {
    if (typeof value === 'string') return JSON.stringify(value);
    if (value === null || ['number', 'boolean', 'undefined'].includes(typeof value)) return String(value);
    return '';
};

export const stringifyJson = (value: unknown) => {
    const ancestors: object[] = [];

    return JSON.stringify(value, function (_key, current: unknown) {
        if (!isContainer(current)) return current;

        while (ancestors.length && ancestors.at(-1) !== this) ancestors.pop();
        if (ancestors.includes(current)) return '[Circular]';

        ancestors.push(current);
        return current;
    }, 2);
};

export const unresolvedResultLabel = (value: unknown) => {
    if (typeof value !== 'string') return null;
    const match = value.match(/^\[Needs run: ([^\]]+)\]$/);
    return match?.[1] ?? null;
};

export const isUnavailableResult = (value: unknown) => value === unavailableOutputPlaceholder;

export const isContainer = (value: unknown): value is object => Boolean(value) && typeof value === 'object';

export const containerSummary = (value: unknown) => {
    if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
    if (isContainer(value)) {
        const count = Object.keys(value).length;
        return `${count} key${count === 1 ? '' : 's'}`;
    }
    return '';
};

export const getContainerEntries = (value: object, path: string): ContainerEntry[] => {
    if (Array.isArray(value)) {
        return value.slice(0, MAX_ARRAY_ITEMS).map((item, index) => ({
            key: `[${index}]`,
            path: appendPath(path, index),
            value: item,
        }));
    }

    return Object.entries(value).slice(0, MAX_OBJECT_ENTRIES).map(([key, item]) => ({
        key,
        path: appendPath(path, key),
        value: item,
    }));
};

export const hiddenEntryCount = (value: object) => {
    const size = Array.isArray(value) ? value.length : Object.keys(value).length;
    const limit = Array.isArray(value) ? MAX_ARRAY_ITEMS : MAX_OBJECT_ENTRIES;
    return Math.max(0, size - limit);
};

export const buildTreeRows = (value: unknown, rootPath: string): InspectorTreeRow[] => {
    const rows: InspectorTreeRow[] = [];

    const visit = (current: unknown, key: string, path: string, depth: number, ancestors: Set<object>) => {
        const circular = isContainer(current) && ancestors.has(current);
        rows.push({ key, path, type: circular ? 'circular' : valueType(current), depth, value: current });
        if (!isContainer(current) || circular) return;

        const nextAncestors = new Set(ancestors).add(current);
        getContainerEntries(current, path).forEach(entry => {
            visit(entry.value, entry.key, entry.path, depth + 1, nextAncestors);
        });
    };

    visit(value, rootPath, rootPath, 0, new Set());
    return rows;
};
