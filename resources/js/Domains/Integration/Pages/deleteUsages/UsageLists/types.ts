import type { Key } from 'react';

export interface FlowUsage {
    flow_id: Id;
    flow_name: string;
    icon_type?: string;
    icon_value?: string | null;
    icon_color?: string | null;
    icon_url?: string | null;
}

export interface ItemUsage {
    key: Key;
    label: string;
    icon: string;
}
