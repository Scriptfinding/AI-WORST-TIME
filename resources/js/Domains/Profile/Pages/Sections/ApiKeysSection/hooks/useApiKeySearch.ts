import { useMemo, useState } from 'react';
import type { ApiKey } from '@/Domains/Profile/types';

// Filters API keys by their name or masked key preview.
export function useApiKeySearch(apiKeys: ApiKey[]) {
    const [search, setSearch] = useState('');

    const filteredKeys = useMemo(() => {
        if (!search.trim()) return apiKeys;

        const query = search.trim().toLowerCase();
        return apiKeys.filter(key =>
            key.name.toLowerCase().includes(query)
            || key.key_preview?.toLowerCase().includes(query),
        );
    }, [apiKeys, search]);

    return {
        filteredKeys,
        search,
        setSearch,
    };
}
