import type { OnMount } from '@monaco-editor/react';
import type { IntegrationProvider } from '@/Domains/Integration/types';
import { getProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import { fetchAiModelSuggestions } from '@/Domains/AiModel/aiModelSuggestions';
import { matchesCompletionModelUri, idCompletionItem, type CompletionModel, type CompletionPosition } from './completionCore';

const AI_MODEL_ARG_PATTERN = /\$(aiMessage|aiControl)\(\s*(["'])([^"']*)$/;

export function registerAiModelCompletions(monaco: Parameters<OnMount>[1], modelUri?: string | null) {
    if (!monaco) return { dispose: () => {} };

    return monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['"', "'"],
        provideCompletionItems: async (model: CompletionModel, position: CompletionPosition) => {
            if (!matchesCompletionModelUri(model, modelUri)) return { suggestions: [] };

            const textBefore = model.getLineContent(position.lineNumber).substring(0, position.column - 1);
            const aiModelMatch = textBefore.match(AI_MODEL_ARG_PATTERN);
            if (!aiModelMatch) return { suggestions: [] };

            const models = await fetchAiModelSuggestions();
            const helper = aiModelMatch[1];
            const typed = aiModelMatch[3] ?? '';
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column - typed.length,
                endColumn: position.column,
            };

            return {
                suggestions: models
                    .filter(item => helper === 'aiControl'
                        ? item.capabilities.vision === true
                        : item.capabilities.text === true)
                    .map(item => {
                        const provider = getProviderConfig(item.ai_integration.provider as IntegrationProvider);
                        const providerLabel = provider?.label ?? item.ai_integration.provider;

                        return idCompletionItem(item, {
                            kind: monaco.languages.CompletionItemKind.Value,
                            detail: `${providerLabel} · ${item.ai_integration.name} · ${item.ai_model_id}`,
                            documentation: `AI integration: ${item.ai_integration.name}\n\nModel: ${item.ai_model_id}\n\nScope: ${item.scope}`,
                            range,
                        });
                    }),
            };
        },
    });
}
