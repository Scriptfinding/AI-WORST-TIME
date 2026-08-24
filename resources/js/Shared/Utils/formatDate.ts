function getUserTimezone(): string {
    try {
        const root = document.documentElement;
        return root.dataset.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return 'UTC';
    }
}

export function formatDateTime(
    value: string | Date,
    options: Intl.DateTimeFormatOptions = {},
): string {
    const tz = getUserTimezone();
    return new Date(value).toLocaleString(undefined, { ...options, timeZone: tz });
}

export function formatDate(
    value: string | Date,
    options: Intl.DateTimeFormatOptions = {},
): string {
    const tz = getUserTimezone();
    return new Date(value).toLocaleDateString(undefined, { ...options, timeZone: tz });
}

export function formatTime(
    value: string | Date,
    options: Intl.DateTimeFormatOptions = {},
): string {
    const tz = getUserTimezone();
    return new Date(value).toLocaleTimeString(undefined, { ...options, timeZone: tz });
}
