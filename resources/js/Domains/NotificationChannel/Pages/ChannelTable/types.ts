import type { NotificationChannel } from '@/Domains/NotificationChannel/types';
import type { TableFilters, TableFilterTeam } from '@/Shared/UI/TableFilters/types';

export type ChannelTableFilters = TableFilters;

export type ChannelTableTeam = TableFilterTeam;

export interface GroupHeader {
    label: string;
    depth: number;
    key: string;
    count: number;
}

export interface GroupedChannelSection {
    group: string | null;
    items: NotificationChannel[];
    headers: GroupHeader[];
}
