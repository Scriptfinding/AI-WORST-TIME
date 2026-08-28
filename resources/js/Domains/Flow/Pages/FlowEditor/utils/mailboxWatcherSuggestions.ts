import type { OnMount } from '@monaco-editor/react';
import { matchesCompletionModelUri, idCompletionItem, type CompletionModel, type CompletionPosition } from './completionCore';

export type WatcherSuggestion = {
    id: Id;
    name: string;
    address: string;
    scope: string;
    team_name: string | null;
};

const cachedWatcherSuggestions = new Map<Id, WatcherSuggestion[]>();
const watcherSuggestionRequests = new Map<Id, Promise<WatcherSuggestion[]>>();

export function fetchMailboxWatcherSuggestions(flowId: Id, force = false): Promise<WatcherSuggestion[]> {
    const cached = cachedWatcherSuggestions.get(flowId);
    if (!force && cached) return Promise.resolve(cached);

    const pending = watcherSuggestionRequests.get(flowId);
    if (pending) return pending;

    const request = fetch(`/flows/${flowId}/mailbox-watchers/suggestions`, { cache: 'no-store' })
        .then(response => {
            if (!response.ok) throw new Error('Unable to load mailbox watchers.');
            return response.json();
        })
        .then(payload => {
            const watchers: WatcherSuggestion[] = Array.isArray(payload) ? payload : [];
            cachedWatcherSuggestions.set(flowId, watchers);
            return watchers;
        })
        .catch(() => cachedWatcherSuggestions.get(flowId) ?? [])
        .finally(() => {
            watcherSuggestionRequests.delete(flowId);
        });

    watcherSuggestionRequests.set(flowId, request);
    return request;
}

export function invalidateWatcherCache() {
    cachedWatcherSuggestions.clear();
}

const WATCHER_FN_PATTERN = /\$waitForEmail\(\s*(["'])([a-zA-Z0-9_-]*)$/;

export function registerMailboxWatcherCompletions(monaco: Parameters<OnMount>[1], flowId: Id, modelUri?: string | null) {
    if (!monaco) return { dispose: () => {} };
    return monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['"', "'"],
        provideCompletionItems: async (model: CompletionModel, position: CompletionPosition) => {
            if (!matchesCompletionModelUri(model, modelUri)) return { suggestions: [] };

            const lineContent = model.getLineContent(position.lineNumber);
            const textBefore = lineContent.substring(0, position.column - 1);

            const match = textBefore.match(WATCHER_FN_PATTERN);
            if (!match) return { suggestions: [] };

            const typed = match[2];
            const startCol = position.column - typed.length;
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: startCol,
                endColumn: position.column,
            };

            const watchers = await fetchMailboxWatcherSuggestions(flowId);

            const suggestions = watchers.map(watcher => idCompletionItem(watcher, {
                kind: monaco.languages.CompletionItemKind.Value,
                detail: `${watcher.address} - ${watcher.id}`,
                documentation: `${watcher.name}\n$waitForEmail("${watcher.id}")`,
                range,
            }));

            return { suggestions };
        },
    });
}
