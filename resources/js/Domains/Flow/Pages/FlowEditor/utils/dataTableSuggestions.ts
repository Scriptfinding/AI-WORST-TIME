import type { OnMount } from '@monaco-editor/react';
import {
    completionRange,
    idCompletionItem,
    matchesCompletionModelUri,
    type CompletionModel,
    type CompletionPosition,
} from './completionCore';

export type DataTableSuggestion = {
    id: Id;
    name: string;
    description?: string | null;
    visibility?: string;
    can_manage: boolean;
    columns: Array<{
        id: Id;
        name: string;
        type: string;
    }>;
};

const cachedSuggestions = new Map<Id, DataTableSuggestion[]>();
const pendingRequests = new Map<Id, Promise<DataTableSuggestion[]>>();
const TABLE_HELPER = 'dataTable(?:InsertRow|UpdateRows|UpsertRows|RowExists|RowDoesNotExist|GetRows|DeleteRows|Delete|Update)';
const TABLE_ARGUMENT_PATTERN = new RegExp(`\\$(${TABLE_HELPER})\\(\\s*(["'])([^"']*)$`);

export function invalidateDataTableCache(): void {
    cachedSuggestions.clear();
}

export function fetchDataTableSuggestions(flowId: Id, force = false): Promise<DataTableSuggestion[]> {
    const cached = cachedSuggestions.get(flowId);
    if (!force && cached) return Promise.resolve(cached);
    const pending = pendingRequests.get(flowId);
    if (pending) return pending;

    const request = fetch(`/flows/${flowId}/data-table-resources`, { cache: 'no-store' })
        .then(response => {
            if (!response.ok) throw new Error('Unable to load Data Tables.');
            return response.json();
        })
        .then(payload => {
            const suggestions: DataTableSuggestion[] = Array.isArray(payload) ? payload : [];
            cachedSuggestions.set(flowId, suggestions);
            return suggestions;
        })
        .catch(() => cachedSuggestions.get(flowId) ?? [])
        .finally(() => {
            pendingRequests.delete(flowId);
        });

    pendingRequests.set(flowId, request);
    return request;
}

export function registerDataTableCompletions(
    monaco: Parameters<OnMount>[1],
    flowId: Id,
    modelUri?: string | null,
) {
    if (!monaco) return { dispose: () => {} };

    return monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['"', "'"],
        provideCompletionItems: async (model: CompletionModel, position: CompletionPosition) => {
            if (!matchesCompletionModelUri(model, modelUri)) return { suggestions: [] };
            const textBefore = model.getLineContent(position.lineNumber).substring(0, position.column - 1);
            const tableMatch = textBefore.match(TABLE_ARGUMENT_PATTERN);
            if (!tableMatch) return { suggestions: [] };

            const typed = tableMatch[3] ?? '';
            const tables = await fetchDataTableSuggestions(flowId);

            return {
                suggestions: tables.map(table => idCompletionItem(table, {
                    kind: monaco.languages.CompletionItemKind.Value,
                    detail: `${table.columns.length} columns - ${table.id}`,
                    documentation: [
                        `Data Table: ${table.name}`,
                        table.description || null,
                        `Visibility: ${table.visibility ?? 'unknown'}`,
                    ].filter(Boolean).join('\n\n'),
                    range: completionRange(position, typed),
                })),
            };
        },
    });
}
