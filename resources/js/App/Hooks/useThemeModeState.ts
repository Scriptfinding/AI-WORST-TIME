import { useEffect, useState } from 'react';
import {
    BRANDING_CHANGE_EVENT,
    getSystemPreference,
    type ResolvedThemeMode,
} from './themeModeUtils';

// Mirrors the operating system color-scheme preference as reactive theme state.
export function useSystemThemePreference(): ResolvedThemeMode {
    const [systemPreference, setSystemPreference] = useState<ResolvedThemeMode>(getSystemPreference);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (event: MediaQueryListEvent) => setSystemPreference(event.matches ? 'dark' : 'light');
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return systemPreference;
}

// Keeps the theme accent color synchronized with runtime branding changes.
export function useBrandingAccentColor(initialAccentColor?: string): string | undefined {
    const [accentColor, setAccentColor] = useState(initialAccentColor);

    useEffect(() => {
        const handleChange = (event: Event) => {
            setAccentColor((event as CustomEvent<string>).detail);
        };
        window.addEventListener(BRANDING_CHANGE_EVENT, handleChange);
        return () => window.removeEventListener(BRANDING_CHANGE_EVENT, handleChange);
    }, []);

    return accentColor;
}
