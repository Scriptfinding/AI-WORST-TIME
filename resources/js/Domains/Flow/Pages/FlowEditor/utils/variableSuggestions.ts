import type { OnMount } from '@monaco-editor/react';
import { DATA_TYPE_ICONS } from '@/Shared/Utils/dataTypeIcons';
import { matchesCompletionModelUri, idCompletionItem, type CompletionModel, type CompletionPosition } from './completionCore';

export type VariableSuggestion = {
    id: Id;
    key: string;
    type: string;
    scope?: string;
    team_name?: string | null;
    provider?: string | null;
    preview_value?: unknown;
};

export function getVariableSuggestionIcon(variable: Pick<VariableSuggestion, 'type' | 'provider'>) {
    if (variable.provider === 'onepassword') {
        return { icon: 'simple-icons:1password', color: '#0572ec' };
    }

    const icon = variable.type === 'json' || variable.type === 'json_path'
        ? DATA_TYPE_ICONS.object
        : variable.type === 'totp'
            ? DATA_TYPE_ICONS.otp
            : DATA_TYPE_ICONS[variable.type as keyof typeof DATA_TYPE_ICONS] ?? DATA_TYPE_ICONS.variable;

    return { icon };
}
let cachedVariableSuggestions: VariableSuggestion[] | null = null;
let variableSuggestionsPromise: Promise<VariableSuggestion[]> | null = null;
let variableSuggestionsGeneration = 0;

function requestVariableSuggestions(force = false): Promise<VariableSuggestion[]> {
    if (!force && cachedVariableSuggestions) return Promise.resolve(cachedVariableSuggestions);
    if (!force && variableSuggestionsPromise) return variableSuggestionsPromise;

    const generation = variableSuggestionsGeneration;
    const promise = fetch('/variables/suggestions', { cache: 'no-store' })
        .then(response => response.json())
        .then((vars: VariableSuggestion[]) => {
            if (generation !== variableSuggestionsGeneration) {
                return variableSuggestionsPromise ?? cachedVariableSuggestions ?? [];
            }
            cachedVariableSuggestions = vars;
            return vars;
        })
        .catch(() => {
            if (generation !== variableSuggestionsGeneration) {
                return variableSuggestionsPromise ?? cachedVariableSuggestions ?? [];
            }
            return cachedVariableSuggestions ?? [];
        })
        .finally(() => {
            if (generation === variableSuggestionsGeneration && variableSuggestionsPromise === promise) {
                variableSuggestionsPromise = null;
            }
        });
    variableSuggestionsPromise = promise;

    return promise;
}

export function fetchVariableSuggestions(force = false): Promise<VariableSuggestion[]> {
    return requestVariableSuggestions(force);
}

function refreshVariableSuggestions() {
    void requestVariableSuggestions(true);
}

async function fetchVariableSuggestionsForAutocomplete(): Promise<VariableSuggestion[]> {
    const hasCachedSuggestions = Boolean(cachedVariableSuggestions);
    const vars = await fetchVariableSuggestions();
    if (hasCachedSuggestions) refreshVariableSuggestions();
    return vars;
}

export function preloadVariableSuggestions() {
    void requestVariableSuggestions();
}

export function invalidateVariableCache() {
    variableSuggestionsGeneration++;
    cachedVariableSuggestions = null;
    variableSuggestionsPromise = null;
}

export function registerJsonVariableCompletions(monaco: Parameters<OnMount>[1], modelUri?: string | null) {
    if (!monaco) return { dispose: () => {} };
    return monaco.languages.registerCompletionItemProvider('json', {
        triggerCharacters: ['.', '{'],
        provideCompletionItems: async (model: CompletionModel, position: CompletionPosition) => {
            if (!matchesCompletionModelUri(model, modelUri)) return { suggestions: [] };

            const lineContent = model.getLineContent(position.lineNumber);
            const textBefore = lineContent.substring(0, position.column - 1);

            const match = textBefore.match(/\$\{vars\.([a-zA-Z0-9_.]*)$/);
            if (!match) return { suggestions: [] };

            const typedPath = match[1];
            const lastDot = typedPath.lastIndexOf('.');
            const parentPath = lastDot >= 0 ? typedPath.substring(0, lastDot) : '';
            const typedSuffix = lastDot >= 0 ? typedPath.substring(lastDot + 1) : typedPath;

            const startCol = position.column - typedSuffix.length;
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: startCol,
                endColumn: position.column,
            };

            const vars = await fetchVariableSuggestionsForAutocomplete();

            // Paths are keyed by ID; the label mirrors the same path with the human key at the root.
            const filtered = parentPath
                ? vars.filter(variable => String(variable.id).startsWith(parentPath + '.') && String(variable.id).split('.').length === parentPath.split('.').length + 1)
                : vars.filter(variable => !String(variable.id).includes('.'));

            const suggestions = filtered.map(variable => {
                const idSegments = String(variable.id).split('.');
                const labelSegments = variable.key.split('.');
                const insertText = parentPath ? idSegments[idSegments.length - 1] : String(variable.id);
                const label = parentPath ? labelSegments[labelSegments.length - 1] : variable.key;
                return {
                    label,
                    kind: variable.type === 'json_path'
                        ? monaco.languages.CompletionItemKind.Field
                        : monaco.languages.CompletionItemKind.Variable,
                    insertText,
                    filterText: `${label} ${insertText}`,
                    detail: variable.type === 'json_path' ? 'JSON path' : `${variable.id} (${variable.type})`,
                    documentation: `${variable.key}\n\${vars.${variable.id}}`,
                    range,
                };
            });

            return { suggestions };
        },
    });
}

const VARS_FN_PATTERN = /\$vars\(\s*(["'])([a-zA-Z0-9_.-]*)$/;

export function registerVarsCompletions(monaco: Parameters<OnMount>[1], modelUri?: string | null) {
    if (!monaco) return { dispose: () => {} };
    return monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['"', "'"],
        provideCompletionItems: async (model: CompletionModel, position: CompletionPosition) => {
            if (!matchesCompletionModelUri(model, modelUri)) return { suggestions: [] };

            const lineContent = model.getLineContent(position.lineNumber);
            const textBefore = lineContent.substring(0, position.column - 1);

            const functionMatch = textBefore.match(VARS_FN_PATTERN);
            if (!functionMatch) return { suggestions: [] };

            const typed = functionMatch[2] ?? '';
            const startCol = position.column - typed.length;
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: startCol,
                endColumn: position.column,
            };

            const vars = await fetchVariableSuggestionsForAutocomplete();
            const filtered = vars.filter(variable => !String(variable.id).includes('.'));

            const suggestions = filtered.map(variable => idCompletionItem(
                { id: variable.id, name: variable.key },
                {
                    kind: variable.type === 'json_path'
                        ? monaco.languages.CompletionItemKind.Field
                        : monaco.languages.CompletionItemKind.Value,
                    detail: `${variable.id} (${variable.type})`,
                    documentation: `${variable.key}\n$vars("${variable.id}")`,
                    range,
                },
            ));

            return { suggestions };
        },
    });
}
