import { useMemo, useState } from 'react';
import { getSelectedScopeLabel } from '@/Shared/UI/TableFilters/options';
import type { TableFilterOption } from '@/Shared/UI/TableFilters/types';
import type { Snippet } from '@/Domains/Snippet/types';

interface Team {
    id: Id;
    name: string;
}

interface UseSnippetFiltersOptions {
    snippets: Snippet[];
    teams: Team[];
    workspaceSharingEnabled: boolean;
}

// Applies snippet search, scope, activity, and ownership filters.
export function useSnippetFilters({
    snippets,
    teams,
    workspaceSharingEnabled,
}: UseSnippetFiltersOptions) {
    const [search, setSearch] = useState('');
    const [scope, setScope] = useState('');
    const [showInactive, setShowInactive] = useState(true);
    const scopeOptions = useMemo<TableFilterOption[]>(() => [
        { value: '', label: 'All scopes', icon: 'lucide:layers' },
        { value: 'owner', label: 'My snippets', icon: 'lucide:user' },
        ...(workspaceSharingEnabled
            ? [{ value: 'workspace', label: 'Workspace', icon: 'lucide:building-2' }]
            : []),
        ...teams.map(team => ({
            value: `team:${team.id}`,
            label: team.name,
            icon: 'lucide:users-round',
            section: 'team' as const,
        })),
    ], [teams, workspaceSharingEnabled]);
    const selectedScopeLabel = useMemo(
        () => getSelectedScopeLabel(scope, scopeOptions),
        [scope, scopeOptions],
    );
    const filteredSnippets = useMemo(() => {
        let result = snippets;
        if (scope.startsWith('team:')) {
            const teamId = scope.slice(5);
            result = result.filter(snippet => snippet.scope === 'team' && String(snippet.team_id) === teamId);
        } else if (scope) {
            result = result.filter(snippet => snippet.scope === scope);
        }
        if (!showInactive) {
            result = result.filter(snippet => snippet.is_active);
        }
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(snippet =>
                snippet.label.toLowerCase().includes(query)
                || String(snippet.id).toLowerCase().includes(query)
                || (snippet.description || '').toLowerCase().includes(query),
            );
        }
        return result;
    }, [scope, search, showInactive, snippets]);

    const resetFilters = () => {
        setSearch('');
        setScope('');
        setShowInactive(true);
    };

    return {
        filteredSnippets,
        hasActiveFilters: Boolean(search.trim() || scope || !showInactive),
        resetFilters,
        scope,
        scopeOptions,
        search,
        selectedScopeLabel,
        setScope,
        setSearch,
        setShowInactive,
        showInactive,
    };
}
