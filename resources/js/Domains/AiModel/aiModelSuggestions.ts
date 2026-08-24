import type { Id } from '@/Shared/types';

export interface AiModelSuggestion {
    id: Id;
    name: string;
    ai_integration_id: Id;
    ai_model_id: string;
    capabilities: Record<string, boolean>;
    scope: string;
    team_name: string | null;
    ai_integration: {
        id: Id;
        name: string;
        provider: string;
    };
}

let cachedAiModelSuggestions: AiModelSuggestion[] | null = null;
let aiModelSuggestionsRequest: Promise<AiModelSuggestion[]> | null = null;

export function fetchAiModelSuggestions(force = false): Promise<AiModelSuggestion[]> {
    if (!force && cachedAiModelSuggestions?.length) return Promise.resolve(cachedAiModelSuggestions);
    if (aiModelSuggestionsRequest) return aiModelSuggestionsRequest;

    aiModelSuggestionsRequest = fetch('/ai-models/suggestions', { cache: 'no-store' })
        .then(response => {
            if (!response.ok) throw new Error('Unable to load AI models.');
            return response.json();
        })
        .then(payload => {
            cachedAiModelSuggestions = Array.isArray(payload)
                ? payload.filter(item => typeof item?.ai_model_id === 'string')
                : [];
            return cachedAiModelSuggestions;
        })
        .catch(() => [])
        .finally(() => {
            aiModelSuggestionsRequest = null;
        });

    return aiModelSuggestionsRequest;
}

export function invalidateAiModelSuggestionsCache() {
    cachedAiModelSuggestions = null;
}
