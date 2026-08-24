import type { OnMount } from '@monaco-editor/react';
import { matchesCompletionModelUri, idCompletionItem, type CompletionModel, type CompletionPosition } from './completionCore';

export type ChannelSuggestion = {
    id: Id;
    name: string;
    provider: string;
    scope: string;
    team_name: string | null;
    destination: string;
};
let cachedChannelSuggestions: ChannelSuggestion[] | null = null;
let channelSuggestionsRequest: Promise<ChannelSuggestion[]> | null = null;

export function fetchChannelSuggestions(force = false): Promise<ChannelSuggestion[]> {
    if (!force && cachedChannelSuggestions) return Promise.resolve(cachedChannelSuggestions);
    if (channelSuggestionsRequest) return channelSuggestionsRequest;

    channelSuggestionsRequest = fetch('/channels/suggestions', { cache: 'no-store' })
        .then(response => {
            if (!response.ok) throw new Error('Unable to load notification channels.');
            return response.json();
        })
        .then(payload => {
            cachedChannelSuggestions = Array.isArray(payload) ? payload : [];
            return cachedChannelSuggestions;
        })
        .catch(() => cachedChannelSuggestions ?? [])
        .finally(() => {
            channelSuggestionsRequest = null;
        });

    return channelSuggestionsRequest;
}

export function invalidateChannelCache() {
    cachedChannelSuggestions = null;
}

const CHANNEL_FN_PATTERN = /\$(?:notify|waitHumanValidation)\(\s*(["'])([A-Za-z0-9_-]*)$/;

export function registerChannelCompletions(monaco: Parameters<OnMount>[1], modelUri?: string | null) {
    if (!monaco) return { dispose: () => {} };
    return monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['"', "'"],
        provideCompletionItems: async (model: CompletionModel, position: CompletionPosition) => {
            if (!matchesCompletionModelUri(model, modelUri)) return { suggestions: [] };

            const lineContent = model.getLineContent(position.lineNumber);
            const textBefore = lineContent.substring(0, position.column - 1);

            const match = textBefore.match(CHANNEL_FN_PATTERN);
            if (!match) return { suggestions: [] };

            const typed = match[2];
            const startCol = position.column - typed.length;
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: startCol,
                endColumn: position.column,
            };

            const channels = await fetchChannelSuggestions();

            const providerIcons: Record<string, string> = {
                telegram: 'Telegram',
                discord: 'Discord',
                slack: 'Slack',
            };

            const suggestions = channels.map(channel => idCompletionItem(channel, {
                kind: monaco.languages.CompletionItemKind.Value,
                detail: `${providerIcons[channel.provider] || channel.provider} · ${channel.scope} · ${channel.id}`,
                documentation: `${channel.name}\n$notify("${channel.id}", "message")`,
                range,
            }));

            return { suggestions };
        },
    });
}
