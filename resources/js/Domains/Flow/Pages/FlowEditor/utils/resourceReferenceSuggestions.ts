import type { OnMount } from '@monaco-editor/react';
import { fetchAiModelSuggestions } from '@/Domains/AiModel/aiModelSuggestions';
import { fetchChannelSuggestions } from './channelSuggestions';
import { matchesCompletionModelUri, idCompletionItem, type CompletionModel, type CompletionPosition } from './completionCore';
import { fetchMailboxWatcherSuggestions } from './mailboxWatcherSuggestions';

const REFERENCE_PATTERN = /\$\{(channels|mailboxWatchers|aiModels)\.([a-zA-Z0-9_.-]*)$/;
const NAMESPACE_PATTERN = /\$\{([a-zA-Z]*)$/;

const NAMESPACE_DETAILS: Record<string, string> = {
    vars: 'Variables',
    channels: 'Notification channels',
    mailboxWatchers: 'Mailbox watchers',
    aiModels: 'AI models',
};

export function registerJsonReferenceNamespaceCompletions(
    monaco: Parameters<OnMount>[1],
    namespaces: string[],
    modelUri?: string | null,
) {
    if (!monaco) return { dispose: () => {} };

    return monaco.languages.registerCompletionItemProvider('json', {
        triggerCharacters: ['{'],
        provideCompletionItems: (model: CompletionModel, position: CompletionPosition) => {
            if (!matchesCompletionModelUri(model, modelUri)) return { suggestions: [] };

            const lineContent = model.getLineContent(position.lineNumber);
            const textBefore = lineContent.substring(0, position.column - 1);
            const match = textBefore.match(NAMESPACE_PATTERN);
            if (!match) return { suggestions: [] };

            const typed = match[1];
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column - typed.length,
                endColumn: position.column,
            };

            return {
                suggestions: namespaces.map((namespace, index) => ({
                    label: namespace,
                    kind: monaco.languages.CompletionItemKind.Module,
                    insertText: `${namespace}.`,
                    detail: NAMESPACE_DETAILS[namespace],
                    documentation: `\${${namespace}.…}`,
                    range,
                    sortText: String(index),
                    // Re-open the suggest widget so the user can chain into id completion.
                    command: { id: 'editor.action.triggerSuggest', title: 'Trigger Suggest' },
                })),
            };
        },
    });
}

export function registerJsonResourceReferenceCompletions(
    monaco: Parameters<OnMount>[1],
    flowId: Id,
    modelUri?: string | null,
) {
    if (!monaco) return { dispose: () => {} };

    return monaco.languages.registerCompletionItemProvider('json', {
        triggerCharacters: ['.'],
        provideCompletionItems: async (model: CompletionModel, position: CompletionPosition) => {
            if (!matchesCompletionModelUri(model, modelUri)) return { suggestions: [] };

            const lineContent = model.getLineContent(position.lineNumber);
            const textBefore = lineContent.substring(0, position.column - 1);
            const match = textBefore.match(REFERENCE_PATTERN);
            if (!match) return { suggestions: [] };

            const [, namespace, typed] = match;
            const startColumn = position.column - typed.length;
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn,
                endColumn: position.column,
            };

            if (namespace === 'channels') {
                const channels = await fetchChannelSuggestions();
                return {
                    suggestions: channels.map(channel => idCompletionItem(channel, {
                        kind: monaco.languages.CompletionItemKind.Reference,
                        detail: `${channel.provider} · ${channel.scope} · ${channel.id}`,
                        range,
                    })),
                };
            }

            if (namespace === 'mailboxWatchers') {
                const watchers = await fetchMailboxWatcherSuggestions(flowId);
                return {
                    suggestions: watchers.map(watcher => idCompletionItem(watcher, {
                        kind: monaco.languages.CompletionItemKind.Reference,
                        detail: `${watcher.address} · ${watcher.id}`,
                        range,
                    })),
                };
            }

            const models = await fetchAiModelSuggestions();
            return {
                suggestions: models.map(aiModel => idCompletionItem(aiModel, {
                    kind: monaco.languages.CompletionItemKind.Reference,
                    detail: `${aiModel.ai_integration.name} · ${aiModel.id}`,
                    range,
                })),
            };
        },
    });
}
