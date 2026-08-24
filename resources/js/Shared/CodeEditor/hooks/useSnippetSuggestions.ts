import { useEffect, useState } from 'react';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';

export interface SnippetSuggestion {
    id: string;
    label: string;
    args: string;
    description: string | null;
    edit_url: string;
}

export const snippetSuggestionToHelpEntry = (snippet: SnippetSuggestion): HelpEntryDef => ({
    name: `$$${snippet.id}`,
    signature: `$$${snippet.id}(${snippet.args})`,
    // No fallback to the label: it is already shown as the entry title.
    desc: snippet.description || '',
    displayLabel: snippet.label,
    category: 'Snippets',
    editUrl: snippet.edit_url,
});

interface UseSnippetSuggestionsOptions {
    enabled?: boolean;
    mapSuggestion?: (suggestion: SnippetSuggestion) => HelpEntryDef;
    refreshKey?: number;
}

// Fetches reusable snippet suggestions for the code editor help panel.
export function useSnippetSuggestions({
    enabled = true,
    mapSuggestion = snippetSuggestionToHelpEntry,
    refreshKey = 0,
}: UseSnippetSuggestionsOptions = {}) {
    const [entries, setEntries] = useState<HelpEntryDef[]>([]);

    useEffect(() => {
        if (!enabled) return;

        const controller = new AbortController();

        fetch('/snippets/suggestions', { signal: controller.signal, cache: 'no-store' })
            .then(response => response.json())
            .then((items: SnippetSuggestion[]) => {
                setEntries(items.map(mapSuggestion));
            })
            .catch(() => {});

        return () => controller.abort();
    }, [enabled, mapSuggestion, refreshKey]);

    return entries;
}
