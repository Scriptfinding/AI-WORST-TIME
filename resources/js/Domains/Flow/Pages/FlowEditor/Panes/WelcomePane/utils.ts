export const PRESET_COLORS = [
    '#1e1e1e', '#6b7280', '#d1d5db', '#ffffff',
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
    '#f43f5e', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

export const DEFAULT_COLOR = '#10b981';

export function isCustomCoverColor(color: string | null): boolean {
    return !!color && !PRESET_COLORS.includes(color) && color !== DEFAULT_COLOR;
}

export function formatDuration(milliseconds: number): string {
    if (!milliseconds || isNaN(milliseconds)) return '0s';
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}
