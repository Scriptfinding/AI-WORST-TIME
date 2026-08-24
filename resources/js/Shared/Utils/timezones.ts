const RAW_TIMEZONES = Intl.supportedValuesOf('timeZone');

function getUtcOffset(tz: string): string {
    try {
        const now = new Date();
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            timeZoneName: 'shortOffset',
        }).formatToParts(now);
        const offsetPart = parts.find(p => p.type === 'timeZoneName');
        return offsetPart?.value ?? '';
    } catch {
        return '';
    }
}

function getNumericOffset(tz: string): number {
    try {
        const now = new Date();
        const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' });
        const tzStr = now.toLocaleString('en-US', { timeZone: tz });
        return (new Date(tzStr).getTime() - new Date(utcStr).getTime()) / 60000;
    } catch {
        return 0;
    }
}

export interface TimezoneOption {
    value: string;
    label: string;
    offset: number;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = RAW_TIMEZONES
    .map(tz => ({
        value: tz,
        label: `(${getUtcOffset(tz)}) ${tz.replace(/_/g, ' ')}`,
        offset: getNumericOffset(tz),
    }))
    .sort((a, b) => a.offset - b.offset || a.value.localeCompare(b.value));
