const shared = {
    radius: {
        xxs: '2px',
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
    },
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        xxl: '32px',
    },
    font: {
        sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    },
    transition: {
        fast: '120ms ease',
        normal: '200ms ease',
        slow: '300ms ease',
    },
} as const;

export const darkTheme = {
    ...shared,
    mode: 'dark' as const,
    colors: {
        bg: {
            primary: '#0f0f10',
            secondary: '#18181b',
            tertiary: '#1e1e22',
            elevated: '#27272a',
            hover: '#2a2a2e',
            active: '#333338',
        },
        text: {
            primary: '#fafafa',
            secondary: '#a1a1aa',
            tertiary: '#71717a',
            inverse: '#09090b',
        },
        border: {
            default: '#27272a',
            light: '#3f3f46',
            hardened: '#45454a',
            focus: '#6366f1',
        },
        brand: '#48C591',
        brandHover: '#3db580',
        brandText: '#07120f',
        white: '#ffffff',
        graylight: '#f9fafb',
        black: '#000000',
        accent: {
            primary: '#10b981',
            primaryHover: '#34d399',
            success: '#22c55e',
            successBg: 'rgba(34, 197, 94, 0.1)',
            warning: '#d97706',
            warningHover: '#d97706',
            warningBg: 'rgba(245, 158, 11, 0.1)',
            error: '#ef4444',
            errorBg: 'rgba(239, 68, 68, 0.1)',
            info: '#3b82f6',
            infoBg: 'rgba(59, 130, 246, 0.1)',
            default: '#AAA',
            defaultBg: 'rgba(170, 170, 170, 0.1)',
        },
    },
    shadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
        md: '0 4px 12px rgba(0, 0, 0, 0.4)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
    },
} as const;

export const lightTheme = {
    ...shared,
    mode: 'light' as const,
    colors: {
        bg: {
            primary: '#ffffff',
            secondary: '#f9fafb',
            tertiary: '#f3f4f6',
            elevated: '#ffffff',
            hover: '#e5e7eb',
            active: '#d1d5db',
        },
        text: {
            primary: '#111827',
            secondary: '#4b5563',
            tertiary: '#9ca3af',
            inverse: '#fafafa',
        },
        border: {
            default: '#e5e7eb',
            light: '#d1d5db',
            hardened: '#c1c1c1',
            focus: '#10b981',
        },
        brand: '#48C591',
        brandHover: '#3db580',
        brandText: '#07120f',
        white: '#ffffff',
        black: '#000000',
        accent: {
            primary: '#059669',
            primaryHover: '#047857',
            success: '#16a34a',
            successBg: 'rgba(22, 163, 74, 0.08)',
            warning: '#f59e0b',
            warningHover: '#d97706',
            warningBg: 'rgba(217, 119, 6, 0.08)',
            error: '#dc2626',
            errorBg: 'rgba(220, 38, 38, 0.08)',
            info: '#2563eb',
            infoBg: 'rgba(37, 99, 235, 0.08)',
            default: '#AAA',
            defaultBg: 'rgba(170, 170, 170, 0.1)',
        },
    },
    shadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 12px rgba(0, 0, 0, 0.08)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
    },
} as const;

export const theme = darkTheme;

type WidenStringLiterals<T> = T extends string
    ? string
    : { [K in keyof T]: WidenStringLiterals<T[K]> };

export type Theme = Omit<WidenStringLiterals<typeof darkTheme>, 'mode'> & {
    mode: 'dark' | 'light';
};
