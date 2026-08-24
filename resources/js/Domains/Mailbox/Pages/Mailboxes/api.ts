import { csrfHeaders } from '@/Shared/Utils/csrf';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...csrfHeaders(),
            ...(options?.headers || {}),
        },
    });

    return response.json();
}
