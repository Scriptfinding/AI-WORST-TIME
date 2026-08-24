import { csrfHeaders } from '@/Shared/Utils/csrf';
import { formatDateTime } from '@/Shared/Utils/formatDate';
import type { PrivateLibrary } from './types.pp';

interface ErrorPayload {
    message?: string;
}

export async function requestJson<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...csrfHeaders(),
            ...(options.headers || {}),
        },
    });

    const payload = await response.json().catch(() => ({})) as T & ErrorPayload;
    if (!response.ok) {
        throw new Error(payload.message || 'Private library request failed.');
    }

    return payload;
}

export function formatLibraryCachedAt(value: string | null): string {
    if (!value) return 'Not cached yet';
    return formatDateTime(value, { dateStyle: 'medium', timeStyle: 'short' });
}

export function getLibraryVisibilityIcon(library: PrivateLibrary): string {
    if (library.visibility === 'team') return 'lucide:users-round';
    if (library.visibility === 'workspace') return 'lucide:building-2';
    return 'lucide:user';
}

export function getLibraryVisibilityLabel(library: PrivateLibrary): string {
    if (library.visibility === 'workspace') return 'Workspace';
    if (library.visibility === 'team') return `Team: ${library.team?.name || '-'}`;
    return 'Personal';
}
