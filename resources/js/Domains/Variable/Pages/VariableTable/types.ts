import type { UserVariable } from '@/Domains/Variable/types';
import type { TableFilters, TableFilterTeam } from '@/Shared/UI/TableFilters/types';

export type VariableTableFilters = TableFilters;
export type VariableTableTeam = TableFilterTeam;

export interface GroupHeader {
    label: string;
    depth: number;
    key: string;
    count: number;
}

export interface GroupedVariableSection {
    group: string | null;
    items: UserVariable[];
    headers: GroupHeader[];
}
