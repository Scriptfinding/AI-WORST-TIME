import type { StickyNoteColor } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';

type StickyNoteColorSet = { background: string; border: string; text: string; muted: string };

export const STICKY_NOTE_COLORS: Record<Exclude<StickyNoteColor, 'custom'>, StickyNoteColorSet> = {
    yellow: { background: '#fef3c7', border: '#f59e0b', text: '#422006', muted: '#92400e' },
    orange: { background: '#ffedd5', border: '#f97316', text: '#431407', muted: '#c2410c' },
    red: { background: '#fee2e2', border: '#ef4444', text: '#450a0a', muted: '#b91c1c' },
    green: { background: '#dcfce7', border: '#22c55e', text: '#052e16', muted: '#166534' },
    teal: { background: '#ccfbf1', border: '#14b8a6', text: '#042f2e', muted: '#0f766e' },
    blue: { background: '#dbeafe', border: '#3b82f6', text: '#172554', muted: '#1d4ed8' },
    indigo: { background: '#e0e7ff', border: '#6366f1', text: '#1e1b4b', muted: '#4338ca' },
    purple: { background: '#ede9fe', border: '#8b5cf6', text: '#2e1065', muted: '#6d28d9' },
    pink: { background: '#fce7f3', border: '#ec4899', text: '#500724', muted: '#be185d' },
    gray: { background: '#f1f5f9', border: '#64748b', text: '#0f172a', muted: '#475569' },
};

const DARK_STICKY_NOTE_COLORS: Record<Exclude<StickyNoteColor, 'custom'>, StickyNoteColorSet> = {
    yellow: { background: '#422006', border: '#f59e0b', text: '#fef3c7', muted: '#fde68a' },
    orange: { background: '#431407', border: '#f97316', text: '#ffedd5', muted: '#fed7aa' },
    red: { background: '#450a0a', border: '#ef4444', text: '#fee2e2', muted: '#fecaca' },
    green: { background: '#052e16', border: '#22c55e', text: '#dcfce7', muted: '#bbf7d0' },
    teal: { background: '#042f2e', border: '#14b8a6', text: '#ccfbf1', muted: '#99f6e4' },
    blue: { background: '#172554', border: '#3b82f6', text: '#dbeafe', muted: '#bfdbfe' },
    indigo: { background: '#1e1b4b', border: '#6366f1', text: '#e0e7ff', muted: '#c7d2fe' },
    purple: { background: '#2e1065', border: '#8b5cf6', text: '#ede9fe', muted: '#ddd6fe' },
    pink: { background: '#500724', border: '#ec4899', text: '#fce7f3', muted: '#fbcfe8' },
    gray: { background: '#1e293b', border: '#64748b', text: '#f1f5f9', muted: '#cbd5e1' },
};

const isKnownStickyNoteColor = (color: StickyNoteColor): color is Exclude<StickyNoteColor, 'custom'> => color !== 'custom';

const readableTextColor = (color: string) => {
    const match = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!match) return '#0f172a';

    const [, red, green, blue] = match;
    const luminance = (0.299 * parseInt(red, 16) + 0.587 * parseInt(green, 16) + 0.114 * parseInt(blue, 16)) / 255;
    return luminance > 0.58 ? '#0f172a' : '#ffffff';
};

const darkenCustomColor = (color: string) => {
    const match = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!match) return '#1e293b';

    return `#${match.slice(1).map(channel => Math.round(parseInt(channel, 16) * 0.35)
        .toString(16)
        .padStart(2, '0')).join('')}`;
};

export const stickyNoteColors = (
    color: StickyNoteColor,
    customColor?: string,
    mode: 'light' | 'dark' = 'light',
): StickyNoteColorSet => {
    if (isKnownStickyNoteColor(color)) {
        return mode === 'dark' ? DARK_STICKY_NOTE_COLORS[color] : STICKY_NOTE_COLORS[color];
    }

    const sourceColor = customColor || '#ffffff';
    const background = mode === 'dark' ? darkenCustomColor(sourceColor) : sourceColor;
    const text = readableTextColor(background);
    return {
        background,
        border: sourceColor,
        text,
        muted: text === '#ffffff' ? '#f8fafc' : '#475569',
    };
};
