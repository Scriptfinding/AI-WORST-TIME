import type { OnMount } from '@monaco-editor/react';
import { matchesCompletionModelUri, type CompletionModel, type CompletionPosition } from './completionCore';

export type SnippetEntry = { id: Id; label: string; args: string; description: string | null };
let cachedSnippetSuggestions: SnippetEntry[] | null = null;
let snippetSuggestionsRequest: Promise<SnippetEntry[]> | null = null;
let snippetExtraLibHandle: { dispose: () => void } | null = null;

export function fetchSnippetSuggestions(monaco?: Parameters<OnMount>[1]): Promise<SnippetEntry[]> {
    const suggestions = cachedSnippetSuggestions
        ? Promise.resolve(cachedSnippetSuggestions)
        : requestSnippetSuggestions();

    return suggestions.then(snippets => {
        if (monaco && snippets.length > 0) {
            registerSnippetExtraLib(monaco, snippets);
        }
        return snippets;
    });
}

function requestSnippetSuggestions(): Promise<SnippetEntry[]> {
    if (snippetSuggestionsRequest) return snippetSuggestionsRequest;

    snippetSuggestionsRequest = fetch('/snippets/suggestions')
        .then(response => {
            if (!response.ok) throw new Error('Unable to load snippets.');
            return response.json();
        })
        .then(payload => {
            cachedSnippetSuggestions = Array.isArray(payload) ? payload : [];
            return cachedSnippetSuggestions;
        })
        .catch(() => cachedSnippetSuggestions ?? [])
        .finally(() => {
            snippetSuggestionsRequest = null;
        });

    return snippetSuggestionsRequest;
}

function registerSnippetExtraLib(monaco: NonNullable<Parameters<OnMount>[1]>, snippets: SnippetEntry[]) {
    if (snippetExtraLibHandle) return;
    const lines = snippets.map(snippet => {
        const doc = snippet.description ? `${snippet.label} — ${snippet.description}` : snippet.label;
        return `/** ${doc} */\ndeclare function $$${snippet.id}(${snippet.args || ''}): any;`;
    });
    snippetExtraLibHandle = monaco.languages.typescript.javascriptDefaults.addExtraLib(
        lines.join('\n'),
        'puppetflow-snippets.d.ts',
    );
}

export function invalidateSnippetCache() {
    cachedSnippetSuggestions = null;
    if (snippetExtraLibHandle) {
        snippetExtraLibHandle.dispose();
        snippetExtraLibHandle = null;
    }
}

const SNIPPET_FN_PATTERN = /(\$\$[A-Za-z0-9_]*)$/;

export function registerSnippetCompletions(monaco: Parameters<OnMount>[1], modelUri?: string | null) {
    if (!monaco) return { dispose: () => {} };
    fetchSnippetSuggestions(monaco);
    return monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['$'],
        provideCompletionItems: async (model: CompletionModel, position: CompletionPosition) => {
            if (!matchesCompletionModelUri(model, modelUri)) return { suggestions: [] };

            const lineContent = model.getLineContent(position.lineNumber);
            const textBefore = lineContent.substring(0, position.column - 1);

            const match = textBefore.match(SNIPPET_FN_PATTERN);
            if (!match) return { suggestions: [] };

            const fullMatch = match[1];
            const startCol = position.column - fullMatch.length;
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: startCol,
                endColumn: position.column,
            };

            const snippets = await fetchSnippetSuggestions(monaco) ?? [];

            const suggestions = snippets.map(snippet => ({
                label: snippet.label,
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: `$$${snippet.id}(${snippet.args})`,
                detail: `$$${snippet.id}`,
                documentation: snippet.description || `$$${snippet.id}(${snippet.args})`,
                range,
                filterText: `$$${snippet.label} $$${snippet.id}`,
                sortText: snippet.label,
            }));

            return { suggestions };
        },
    });
}
