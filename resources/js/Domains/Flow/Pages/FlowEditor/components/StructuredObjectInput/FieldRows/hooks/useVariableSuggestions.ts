import { useCallback, useEffect, useState } from 'react';
import {
    fetchVariableSuggestions,
    type VariableSuggestion,
} from '@/Domains/Flow/Pages/FlowEditor/utils/variableSuggestions';

export interface VariableSuggestionsState {
    suggestions: VariableSuggestion[];
    loading: boolean;
    loadFailed: boolean;
    refresh: () => Promise<VariableSuggestion[]>;
}

export function useVariableSuggestions(enabled: boolean): VariableSuggestionsState {
    const [suggestions, setSuggestions] = useState<VariableSuggestion[]>([]);
    const [loading, setLoading] = useState(enabled);
    const [loadFailed, setLoadFailed] = useState(false);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setLoadFailed(false);
        void fetchVariableSuggestions()
            .then(variables => {
                if (!cancelled) setSuggestions(variables);
            })
            .catch(() => {
                if (!cancelled) setLoadFailed(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    const refresh = useCallback(() => {
        setLoading(true);
        setLoadFailed(false);
        return fetchVariableSuggestions(true)
            .then(variables => {
                setSuggestions(variables);
                return variables;
            })
            .catch(error => {
                setLoadFailed(true);
                throw error;
            })
            .finally(() => setLoading(false));
    }, []);

    return { suggestions, loading, loadFailed, refresh };
}
