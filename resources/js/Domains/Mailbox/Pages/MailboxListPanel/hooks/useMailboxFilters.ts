import { useMemo, useState } from 'react';
import { getSelectedScopeLabel } from '@/Shared/UI/TableFilters/options';
import type { TableFilterOption } from '@/Shared/UI/TableFilters/types';
import type { MailboxItem } from '@/Domains/Mailbox/types';

interface Team {
    id: Id;
    name: string;
}

interface UseMailboxFiltersOptions {
    mailboxes: MailboxItem[];
    teams: Team[];
    workspaceSharingEnabled: boolean;
}

// Applies mailbox search, integration, scope, and ordering controls.
export function useMailboxFilters({
    mailboxes,
    teams,
    workspaceSharingEnabled,
}: UseMailboxFiltersOptions) {
    const [search, setSearch] = useState('');
    const [integration, setIntegration] = useState('');
    const [scope, setScope] = useState('');
    const [sortAscending, setSortAscending] = useState(true);

    const scopeOptions = useMemo<TableFilterOption[]>(() => [
        { value: '', label: 'All scopes', icon: 'lucide:layers' },
        { value: 'owner', label: 'My mailboxes', icon: 'lucide:user' },
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

    const filteredMailboxes = useMemo(() => {
        let result = mailboxes;
        if (integration) {
            result = result.filter(mailbox => String(mailbox.integration_id) === integration);
        }
        if (scope.startsWith('team:')) {
            const teamId = scope.slice(5);
            result = result.filter(mailbox => mailbox.scope === 'team' && String(mailbox.team_id) === teamId);
        } else if (scope) {
            result = result.filter(mailbox => mailbox.scope === scope);
        }
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(mailbox => (
                mailbox.slug.toLowerCase().includes(query)
                || mailbox.address.toLowerCase().includes(query)
                || mailbox.domain_name.toLowerCase().includes(query)
            ));
        }
        return [...result].sort((first, second) => {
            const comparison = first.address.localeCompare(second.address);
            return sortAscending ? comparison : -comparison;
        });
    }, [integration, mailboxes, scope, search, sortAscending]);

    const reset = () => {
        setSearch('');
        setIntegration('');
        setScope('');
    };

    return {
        filteredMailboxes,
        hasActiveFilters: Boolean(search.trim() || integration || scope),
        integration,
        reset,
        scope,
        scopeOptions,
        search,
        selectedScopeLabel: getSelectedScopeLabel(scope, scopeOptions),
        setIntegration,
        setScope,
        setSearch,
        setSortAscending,
        sortAscending,
    };
}
