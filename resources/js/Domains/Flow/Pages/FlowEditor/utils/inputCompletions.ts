import type { OnMount } from '@monaco-editor/react';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import {
    completionRange,
    getNestedRecord,
    isCompletionRecord,
    matchesCompletionModelUri,
    topLevelPathSuggestions,
    type CompletionModel,
    type CompletionPosition,
} from './completionCore';
import { PAGE_AUTOCOMPLETE_ENTRIES, type PageAutocompleteEntry } from './pageAutocomplete';

const ROOT_COMPLETION_PATTERN = /(?:^|[^\w$.])(\$[a-zA-Z_]*)$/;

const entriesForPath = (entries: PageAutocompleteEntry[], path: string) => {
    let current = entries;
    for (const segment of path.split('.').filter(Boolean)) {
        const next = current.find(entry => entry.key === segment);
        if (!next?.children) return [];
        current = next.children;
    }

    return current;
};

const pageEntrySuggestions = (
    monaco: Parameters<OnMount>[1],
    entries: PageAutocompleteEntry[],
    rootPath: string,
    range: ReturnType<typeof completionRange>,
) => entries.map(entry => ({
    label: entry.key,
    kind: entry.type === 'method'
        ? monaco.languages.CompletionItemKind.Method
        : monaco.languages.CompletionItemKind.Property,
    insertText: entry.type === 'method' ? `${entry.key}()` : entry.key,
    detail: entry.detail,
    documentation: `${rootPath}.${entry.key} - ${entry.documentation}`,
    range,
    sortText: entry.key,
}));

export function registerInputCompletions(monaco: Parameters<OnMount>[1], defaultInputs: Record<string, unknown> | null, modelUri?: string | null) {
    if (!monaco) return { dispose: () => {} };

    return monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['$', '.', '['],
        provideCompletionItems: (model: CompletionModel, position: CompletionPosition) => {
            if (!matchesCompletionModelUri(model, modelUri)) return { suggestions: [] };

            const lineContent = model.getLineContent(position.lineNumber);
            const textBefore = lineContent.substring(0, position.column - 1);
            const rootMatch = textBefore.match(ROOT_COMPLETION_PATTERN);

            if (rootMatch) {
                const typed = rootMatch[1];
                const range = completionRange(position, typed);

                return {
                    suggestions: [
                        {
                            label: '$input',
                            kind: monaco.languages.CompletionItemKind.Variable,
                            insertText: '$input',
                            detail: 'flow input',
                            documentation: 'Current flow input data.',
                            range,
                        },
                    ],
                };
            }

            if (!defaultInputs || Object.keys(defaultInputs).length === 0) return { suggestions: [] };

            const bracketMatch = textBefore.match(/\$input\s*\[\s*(['"])([a-zA-Z0-9_]*)$/);
            if (bracketMatch) {
                const typed = bracketMatch[2];
                const range = completionRange(position, typed);
                const topKeys = Object.keys(defaultInputs);
                return {
                    suggestions: topKeys.map(key => ({
                        label: key,
                        kind: monaco.languages.CompletionItemKind.Field,
                        insertText: key,
                        detail: `input key`,
                        documentation: `$input["${key}"] - ${typeof defaultInputs?.[key]}`,
                        range,
                    })),
                };
            }

            const dotMatch = textBefore.match(/\$input((?:\.[a-zA-Z_]\w*)*)\.([a-zA-Z_]\w*)?$/);
            if (!dotMatch) return { suggestions: [] };

            const parentPath = dotMatch[1].replace(/^\./, '');
            const typed = dotMatch[2] ?? '';
            const target = getNestedRecord(defaultInputs, parentPath);
            if (!target) return { suggestions: [] };

            return {
                suggestions: topLevelPathSuggestions(monaco, target, parentPath ? `$input.${parentPath}` : '$input', completionRange(position, typed)),
            };
        },
    });
}

export function registerNodalAutocompleteCompletions(
    monaco: Parameters<OnMount>[1],
    context: Omit<NodalAutocompleteContext, 'outputData'> & { outputData?: unknown },
    modelUri?: string | null,
) {
    if (!monaco) return { dispose: () => {} };

    return monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['$', '.', '['],
        provideCompletionItems: (model: CompletionModel, position: CompletionPosition) => {
            if (!matchesCompletionModelUri(model, modelUri)) return { suggestions: [] };

            const lineContent = model.getLineContent(position.lineNumber);
            const textBefore = lineContent.substring(0, position.column - 1);
            const outputData = isCompletionRecord(context.outputData) ? context.outputData : null;
            const nodeData = isCompletionRecord(context.nodeData) ? context.nodeData : null;
            const runData = isCompletionRecord(context.runData) ? context.runData : null;
            const contextData = isCompletionRecord(context.contextData) ? context.contextData : null;

            const rootMatch = textBefore.match(ROOT_COMPLETION_PATTERN);
            if (rootMatch) {
                const typed = rootMatch[1];
                const range = completionRange(position, typed);
                const roots = [
                    { key: '$input', detail: 'flow input', documentation: 'Current flow input data.' },
                    { key: '$page', detail: 'browser page', documentation: 'Current browser page data.' },
                    { key: '$output', detail: 'user output', documentation: 'User output values set by Set Output nodes.' },
                    { key: '$nodes', detail: 'node results', documentation: 'Internal result values from executed nodal nodes.' },
                    { key: '$run', detail: 'run variables', documentation: 'Run-local variables set by nodal nodes.' },
                    { key: '$context', detail: 'flow context', documentation: 'Flow context data, including meta values.' },
                    { key: '$vars', detail: 'site variables', documentation: 'Global site variables.' },
                    { key: '$viewportWidth', detail: 'viewport width', documentation: 'Effective browser viewport width in pixels.' },
                    { key: '$viewportHeight', detail: 'viewport height', documentation: 'Effective browser viewport height in pixels.' },
                    ...context.locals.map(local => ({
                        key: local.key,
                        detail: local.type === 'loop_index' ? 'loop index' : 'loop item',
                        documentation: local.key,
                    })),
                ];

                return {
                    suggestions: roots.map(root => ({
                        label: root.key,
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: root.key,
                        detail: root.detail,
                        documentation: root.documentation,
                        range,
                    })),
                };
            }

            const bracketMatch = textBefore.match(/\$(input|page|output|nodes|run|context)\s*\[\s*(['"])([a-zA-Z0-9_]*)$/);
            if (bracketMatch) {
                const root = `$${bracketMatch[1]}`;
                const source = bracketMatch[1] === 'input'
                    ? context.inputData
                    : bracketMatch[1] === 'page'
                        ? context.pageData
                        : bracketMatch[1] === 'nodes'
                            ? nodeData
                        : bracketMatch[1] === 'run'
                            ? runData
                        : bracketMatch[1] === 'context'
                            ? contextData
                            : outputData;
                const typed = bracketMatch[3];
                const range = completionRange(position, typed);

                if (bracketMatch[1] === 'page') {
                    return {
                        suggestions: pageEntrySuggestions(monaco, PAGE_AUTOCOMPLETE_ENTRIES, root, range).map(suggestion => ({
                            ...suggestion,
                            insertText: suggestion.label,
                        })),
                    };
                }

                return {
                    suggestions: Object.keys(source ?? {}).map(key => ({
                        label: key,
                        kind: monaco.languages.CompletionItemKind.Field,
                        insertText: key,
                        detail: `${bracketMatch[1]} key`,
                        documentation: `${root}["${key}"]`,
                        range,
                        sortText: key,
                    })),
                };
            }

            const dotMatch = textBefore.match(/(\$(?:input|page|output|nodes|run|context))((?:\.[a-zA-Z_$][\w$]*)*)\.([a-zA-Z_$][\w$]*)?$/);
            if (!dotMatch) return { suggestions: [] };

            const root = dotMatch[1];
            const parentPath = dotMatch[2].replace(/^\./, '');
            const typed = dotMatch[3] ?? '';

            const source = root === '$input'
                ? context.inputData
                : root === '$page'
                    ? context.pageData
                    : root === '$nodes'
                        ? nodeData
                    : root === '$run'
                        ? runData
                    : root === '$context'
                        ? contextData
                        : outputData;

            if (root === '$page') {
                return {
                    suggestions: pageEntrySuggestions(monaco, entriesForPath(PAGE_AUTOCOMPLETE_ENTRIES, parentPath), parentPath ? `${root}.${parentPath}` : root, completionRange(position, typed)),
                };
            }

            const target = getNestedRecord(source, parentPath);
            if (!target) return { suggestions: [] };

            return { suggestions: topLevelPathSuggestions(monaco, target, parentPath ? `${root}.${parentPath}` : root, completionRange(position, typed)) };
        },
    });
}
