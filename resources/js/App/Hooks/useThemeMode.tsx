import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ThemeProvider as SCThemeProvider } from 'styled-components';
import { createWhitelabelTheme } from '@proprietary/Domains/Licensing/Utils/createWhitelabelTheme.pp';
import {
    BRANDING_CHANGE_EVENT,
    getStoredMode,
    THEME_MODE_STORAGE_KEY,
    type ThemeMode,
} from './themeModeUtils';
import { useBrandingAccentColor, useSystemThemePreference } from './useThemeModeState';

export { BRANDING_CHANGE_EVENT };
export type { ThemeMode } from './themeModeUtils';

interface ThemeModeContextValue {
    mode: ThemeMode;
    resolved: 'dark' | 'light';
    setMode: (mode: ThemeMode) => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
    mode: 'system',
    resolved: 'dark',
    setMode: () => {},
});

export function ThemeModeProvider({ children, initialAccentColor }: { children: React.ReactNode; initialAccentColor?: string }) {
    const [mode, setModeState] = useState<ThemeMode>(getStoredMode);
    const systemPref = useSystemThemePreference();
    const accentColor = useBrandingAccentColor(initialAccentColor);

    const setMode = useCallback((newMode: ThemeMode) => {
        setModeState(newMode);
        localStorage.setItem(THEME_MODE_STORAGE_KEY, newMode);
    }, []);

    const resolved = mode === 'system' ? systemPref : mode;
    const themeObject = useMemo(
        () => createWhitelabelTheme(resolved, accentColor),
        [accentColor, resolved],
    );

    const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

    return (
        <ThemeModeContext.Provider value={value}>
            <SCThemeProvider theme={themeObject}>
                {children}
            </SCThemeProvider>
        </ThemeModeContext.Provider>
    );
}

// Gives consumers access to the active theme mode and its updater.
export function useThemeMode() {
    return useContext(ThemeModeContext);
}
