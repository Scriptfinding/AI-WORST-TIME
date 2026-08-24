/**
 * Returns CSRF-related headers for raw fetch() calls.
 *
 * Prefer the token rendered by the current app. The XSRF-TOKEN cookie name is
 * shared by Laravel apps on the same domain, so another app can overwrite it.
 */
export function csrfHeaders(): Record<string, string> {
    const metaToken = document
        .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
        ?.content;
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    const cookieToken = match ? decodeURIComponent(match[1]) : '';
    const token = metaToken || cookieToken;

    if (metaToken) {
        return {
            'X-CSRF-TOKEN': token,
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
        };
    }

    return {
        'X-XSRF-TOKEN': token,
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    };
}
