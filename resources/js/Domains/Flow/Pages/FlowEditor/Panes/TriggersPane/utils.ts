export const CRON_PRESETS = [
    { value: '* * * * *', label: 'Every minute' },
    { value: '*/5 * * * *', label: 'Every 5 minutes' },
    { value: '*/15 * * * *', label: 'Every 15 minutes' },
    { value: '*/30 * * * *', label: 'Every 30 minutes' },
    { value: '0 * * * *', label: 'Every hour' },
    { value: '0 */6 * * *', label: 'Every 6 hours' },
    { value: '0 0 * * *', label: 'Daily (midnight)' },
    { value: '0 0 * * 1', label: 'Weekly (Monday)' },
    { value: '0 0 1 * *', label: 'Monthly (1st)' },
    { value: 'custom', label: 'Custom' },
];

export function hasInputTemplateData(template: Record<string, unknown> | null | undefined): boolean {
    return template != null && Object.keys(template).length > 0;
}

