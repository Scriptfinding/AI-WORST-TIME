const TRUSTED_ICON_HOSTS = new Set([
    'raw.githubusercontent.com',
]);

const LOCAL_ICON_HOSTS = new Set([
    'localhost',
    '127.0.0.1',
    '[::1]',
]);

export const safeLibraryIconUrl = (
    value: string | null,
    allowPrivateLibraryHost = false,
): string | null => {
    if (!value) return null;

    try {
        const url = new URL(value, window.location.origin);
        if (url.origin === window.location.origin) return url.toString();
        if (allowPrivateLibraryHost && (url.protocol === 'https:' || url.protocol === 'http:')) {
            return url.toString();
        }
        if (url.protocol === 'https:' && TRUSTED_ICON_HOSTS.has(url.hostname)) return url.toString();
        if (
            url.protocol === 'https:'
            && !url.port
            && (url.hostname === 'puppetflow.com' || url.hostname.endsWith('.puppetflow.com'))
        ) {
            return url.toString();
        }
        if (
            (url.protocol === 'https:' || url.protocol === 'http:')
            && LOCAL_ICON_HOSTS.has(url.hostname)
        ) {
            return url.toString();
        }
    } catch {
        return null;
    }

    return null;
};
