export interface VariableUsage {
    type?: string;
    types?: string[];
    label?: string;
    id?: string;
    flow_id?: Id;
    flow_name?: string;
    icon_type?: string;
    icon_value?: string | null;
    icon_color?: string | null;
    icon_url?: string | null;
}

export function getVariableUsageTypeLabel(type: string) {
    if (type === 'default_input') return 'input';
    if (type === 'input') return 'pinned';
    return type;
}
