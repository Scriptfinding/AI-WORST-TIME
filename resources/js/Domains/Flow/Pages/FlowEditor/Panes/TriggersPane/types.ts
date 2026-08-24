export type TriggerType = 'webhook' | 'cron';

export interface TriggerFormData {
    type: TriggerType;
    label: string;
    input_template: string;
    merge_post_data: boolean;
    cron_expression: string;
    cron_preset: string;
}

export interface TeamOption {
    id: Id;
    name: string;
}
