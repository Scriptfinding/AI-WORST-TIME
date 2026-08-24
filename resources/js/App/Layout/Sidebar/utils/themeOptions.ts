import type { ThemeMode } from '@/App/Hooks/useThemeMode';

export const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: 'lucide:sun' },
    { value: 'dark', label: 'Dark', icon: 'lucide:moon' },
    { value: 'system', label: 'Auto', icon: 'lucide:monitor' },
];
