import { darkTheme, lightTheme, type Theme } from '@/App/Utils/theme';

function shade(hex: string, amount: number): string {
    const normalized = hex.replace('#', '');
    const channels = [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16));
    const adjusted = channels.map((channel) => {
        const target = amount < 0 ? 0 : 255;
        return Math.round(channel + (target - channel) * Math.abs(amount));
    });

    return `#${adjusted.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function contrastColor(hex: string): string {
    const normalized = hex.replace('#', '');
    const [red, green, blue] = [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16));
    const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

    return luminance > 0.58 ? '#07120f' : '#ffffff';
}

export function createWhitelabelTheme(mode: 'dark' | 'light', accentColor?: string): Theme {
    const base = mode === 'dark' ? darkTheme : lightTheme;
    const accent = /^#[0-9A-Fa-f]{6}$/.test(accentColor ?? '') ? accentColor!.toUpperCase() : base.colors.brand;
    const hover = shade(accent, mode === 'dark' ? 0.14 : -0.14);

    return {
        ...base,
        colors: {
            ...base.colors,
            border: {
                ...base.colors.border,
                focus: accent,
            },
            brand: accent,
            brandHover: hover,
            brandText: contrastColor(accent),
            accent: {
                ...base.colors.accent,
                primary: accent,
                primaryHover: hover,
            },
        },
    } as Theme;
}
