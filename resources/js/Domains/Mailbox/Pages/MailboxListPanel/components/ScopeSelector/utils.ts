import type { TableFilterOption } from '@/Shared/UI/TableFilters/types';

export function getScopeIcon(scope: string): string {
    if (scope.startsWith('team:')) return 'lucide:users-round';
    if (scope === 'workspace') return 'lucide:building-2';
    if (scope === 'owner') return 'lucide:user';
    return 'lucide:layers';
}

export function partitionScopeOptions(options: TableFilterOption[]) {
    return {
        defaultOptions: options.filter(option => !option.section),
        teamOptions: options.filter(option => option.section === 'team'),
    };
}
