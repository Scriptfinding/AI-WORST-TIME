import type { FlowRun } from '@/Domains/Flow/types';
import type { PaginatedData } from '@/Shared/Types/pagination';

export type MetaFilter = {
    key: string;
    operator: string;
    value: string;
};

export type MetaPresence = '' | 'any' | 'none';

export type RunUser = {
    id: string;
    name: string;
};

export interface RunsFilters {
    statuses: string[];
    date_from: string | null;
    date_to: string | null;
    legend: string | null;
    duration_min_ms: string | number | null;
    duration_max_ms: string | number | null;
    flow_search: string | null;
    triggered_by: string | null;
    meta_filters: MetaFilter[];
    meta_predicate: 'and' | 'or';
    meta_presence: MetaPresence | null;
    per_page: number;
}

export interface RunsProps {
    runningRuns: PaginatedData<FlowRun>;
    terminatedRuns: PaginatedData<FlowRun>;
    runUsers: RunUser[];
    stats: {
        total: number;
        pending: number;
        running: number;
        success: number;
        error: number;
        cancelled: number;
    };
    concurrentRunsLimit: number;
    filters: RunsFilters;
}
