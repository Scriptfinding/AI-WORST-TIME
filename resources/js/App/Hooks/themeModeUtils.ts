export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedThemeMode = Exclude<ThemeMode, 'system'>;

export const THEME_MODE_STORAGE_KEY = 'pf-theme-mode';
export const BRANDING_CHANGE_EVENT = 'puppetflow:branding-change';

export function getSystemPreference(): ResolvedThemeMode {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredMode(): ThemeMode {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
    return 'system';
}
