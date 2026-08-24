import { csrfHeaders } from '@/Shared/Utils/csrf';
import type { LibraryStoreItem } from './types';

const BLUEPRINTS_PARAM = 'blueprints';
const BLUEPRINT_PARAM = 'blueprint';

export const COLOR_SWATCHES: Record<string, string> = {
    green: '#16a34a',
    blue: '#2563eb',
    cyan: '#0891b2',
    purple: '#7c3aed',
    pink: '#db2777',
    orange: '#ea580c',
    amber: '#d97706',
    slate: '#475569',
    white: '#ffffff',
};

export function formatCategory(value: string | null) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export function itemColor(item: LibraryStoreItem) {
    const color = item.color?.toLowerCase();

    if (color && /^#[0-9a-f]{6}$/.test(color)) {
        return color;
    }

    return COLOR_SWATCHES[color || 'green'] || COLOR_SWATCHES.green;
}

export function privateStoreLabel(item: LibraryStoreItem) {
    return item.private_library_label || 'Private library';
}

function updateBlueprintStoreQuery(mutator: (params: URLSearchParams) => void) {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    mutator(url.searchParams);
    window.history.replaceState(null, '', url.toString());
}

export function shouldOpenLibraryStoreFromQuery() {
    if (typeof window === 'undefined') return false;

    const params = new URLSearchParams(window.location.search);
    return params.get(BLUEPRINTS_PARAM) === '1' || params.has(BLUEPRINT_PARAM);
}

export function openLibraryStoreQuery() {
    updateBlueprintStoreQuery((params) => {
        params.set(BLUEPRINTS_PARAM, '1');
    });
}

export function closeLibraryStoreQuery() {
    updateBlueprintStoreQuery((params) => {
        params.delete(BLUEPRINTS_PARAM);
        params.delete(BLUEPRINT_PARAM);
    });
}

export function syncLibraryStoreQuery(blueprintNamespace: string | null = null) {
    updateBlueprintStoreQuery((params) => {
        params.set(BLUEPRINTS_PARAM, '1');
        if (blueprintNamespace) {
            params.set(BLUEPRINT_PARAM, blueprintNamespace);
        } else {
            params.delete(BLUEPRINT_PARAM);
        }
    });
}

export function getBlueprintNamespaceFromQuery() {
    if (typeof window === 'undefined') return null;

    return new URLSearchParams(window.location.search).get(BLUEPRINT_PARAM);
}

export async function requestLibraryJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...csrfHeaders(),
            ...(options?.headers || {}),
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(error.message || 'Library request failed.');
    }

    return response.json();
}
