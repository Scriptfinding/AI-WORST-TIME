import { useCallback, useState } from 'react';
import { router } from '@inertiajs/react';
import type { TableFilters } from './types';

interface UseTableFiltersOptions {
    filters: TableFilters;
    route: string;
}

// Applies searchable table filters through Inertia while preserving the current page state.
export function useTableFilters({ filters, route }: UseTableFiltersOptions) {
    const [search, setSearch] = useState(filters.search || '');

    const applyFilters = useCallback((overrides: Record<string, string | null> = {}) => {
        const params: Record<string, string> = {};
        const nextSearch = overrides.search ?? search;
        const nextGroup = overrides.group !== undefined ? overrides.group : filters.group;
        const nextScope = overrides.scope !== undefined ? overrides.scope : filters.scope;

        if (nextSearch) params.search = nextSearch;
        if (nextGroup !== null && nextGroup !== undefined) params.group = nextGroup;
        if (nextScope !== null && nextScope !== undefined) params.scope = nextScope;
        router.get(route, params, { preserveState: true, replace: true });
    }, [filters.group, filters.scope, route, search]);

    const resetFilters = () => {
        setSearch('');
        router.get(route, {}, { preserveState: true, replace: true });
    };

    return {
        applyFilters,
        hasActiveFilters: Boolean(filters.search || filters.group !== null || filters.scope),
        resetFilters,
        search,
        setSearch,
    };
}
