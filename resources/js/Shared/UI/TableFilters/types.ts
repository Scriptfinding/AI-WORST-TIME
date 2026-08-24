export interface TableFilters {
    search: string;
    group: string | null;
    scope: string | null;
}

export interface TableFilterTeam {
    id: Id;
    name: string;
}

export interface TableFilterOption {
    value: string;
    label: string;
    icon: string;
    section?: string;
}
