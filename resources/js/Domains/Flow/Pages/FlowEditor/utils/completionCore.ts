import type { OnMount } from '@monaco-editor/react';

export type CompletionModel = {
    getLineContent: (lineNumber: number) => string;
    uri?: { toString: () => string };
};
export type CompletionPosition = { lineNumber: number; column: number };

export const isCompletionRecord = (value: unknown): value is Record<string, unknown> => {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const valueDetail = (value: unknown) => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
};

export const getNestedRecord = (source: Record<string, unknown> | null, path: string) => {
    let target: Record<string, unknown> | null = source;
    if (!path) return target;

    for (const segment of path.split('.').filter(Boolean)) {
        if (!target || !isCompletionRecord(target[segment])) return null;
        target = target[segment] as Record<string, unknown>;
    }

    return target;
};

export const completionRange = (position: CompletionPosition, typed: string) => ({
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: position.column - typed.length,
    endColumn: position.column,
});

export const matchesCompletionModelUri = (model: CompletionModel, modelUri?: string | null) => {
    if (!modelUri) return true;
    return model.uri?.toString() === modelUri;
};

/**
 * Creates ID resource completions with visible names and inserted IDs.
 * Names and IDs remain searchable through filterText.
 */
export const idCompletionItem = (
    item: { id: Id; name: string },
    options: {
        kind: number;
        detail: string;
        range: ReturnType<typeof completionRange>;
        documentation?: string;
    },
) => ({
    label: item.name,
    kind: options.kind,
    insertText: String(item.id),
    filterText: `${item.name} ${item.id}`,
    detail: options.detail,
    documentation: options.documentation,
    range: options.range,
    sortText: item.name,
});

export const topLevelPathSuggestions = (
    monaco: Parameters<OnMount>[1],
    source: Record<string, unknown> | null,
    rootPath: string,
    range: ReturnType<typeof completionRange>,
) => {
    if (!source) return [];

    return Object.entries(source).map(([key, value]) => {
        const isObject = isCompletionRecord(value);

        return {
            label: key,
            kind: isObject
                ? monaco.languages.CompletionItemKind.Module
                : monaco.languages.CompletionItemKind.Field,
            insertText: key,
            detail: valueDetail(value),
            documentation: `${rootPath}.${key}`,
            range,
            sortText: key,
        };
    });
};
