import { csrfHeaders } from '@/Shared/Utils/csrf';

export async function fetchMailboxWatcherJson(url: string, opts?: RequestInit) {
    return fetch(url, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            ...csrfHeaders(),
            ...(opts?.headers || {}),
        },
    });
}
