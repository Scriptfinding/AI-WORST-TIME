import type { TableFilterOption, TableFilterTeam } from './types';

export function buildGroupOptions(groups: string[]): TableFilterOption[] {
    return [
        { value: '__all__', label: 'All groups', icon: 'lucide:layers' },
        { value: '__ungrouped__', label: 'Ungrouped', icon: 'lucide:inbox' },
        ...groups.map(group => ({ value: group, label: group, icon: 'lucide:folder' })),
    ];
}

export function buildScopeOptions(
    teams: TableFilterTeam[],
    workspaceSharingEnabled: boolean,
    personalLabel: string,
): TableFilterOption[] {
    return [
        { value: '__all__', label: 'All scopes', icon: 'lucide:layers' },
        { value: 'user', label: personalLabel, icon: 'lucide:user' },
        ...(workspaceSharingEnabled
            ? [{ value: 'workspace', label: 'Workspace', icon: 'lucide:building-2' }]
            : []),
        ...teams.map(team => ({
            value: `team:${team.id}`,
            label: team.name,
            icon: 'lucide:users-round',
            section: 'team' as const,
        })),
    ];
}

export function filterOptions(options: TableFilterOption[], search: string): TableFilterOption[] {
    if (!search.trim()) return options;
    const query = search.toLowerCase();
    return options.filter(option => option.label.toLowerCase().includes(query));
}

export function getSelectedGroupLabel(group: string | null): string {
    return group === '__ungrouped__' ? 'Ungrouped' : group || 'All groups';
}

export function getSelectedScopeLabel(scope: string | null, options: TableFilterOption[]): string {
    if (!scope) return 'All scopes';
    const match = options.find(option => option.value === scope);
    if (!match) return 'All scopes';
    return match.section === 'team' ? `Team: ${match.label}` : match.label;
}

export function getScopeIcon(scope: string | null): string {
    if (scope?.startsWith('team:')) return 'lucide:users-round';
    if (scope === 'workspace') return 'lucide:building-2';
    if (scope === 'user') return 'lucide:user';
    return 'lucide:layers';
}

export function matchesOwnershipScope(
    item: { visibility: 'owner' | 'workspace' | 'team'; team_id: Id | null },
    scope: string | null,
): boolean {
    if (!scope) return true;
    if (scope === 'user') return item.visibility === 'owner';
    if (scope === 'workspace') return item.visibility === 'workspace';
    if (scope.startsWith('team:')) {
        return item.visibility === 'team' && String(item.team_id) === scope.slice(5);
    }
    return true;
}
