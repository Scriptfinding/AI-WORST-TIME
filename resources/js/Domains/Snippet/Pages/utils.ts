import { csrfHeaders } from '@/Shared/Utils/csrf';

export const getDownloadBaseName = (name: string) => {
    return name.trim().replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'snippet';
};

export const downloadTextFile = (filename: string, content: string, mimeType: string) => {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

export async function fetchJson(url: string, opts?: RequestInit) {
    return fetch(url, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            ...csrfHeaders(),
            ...(opts?.headers || {}),
        },
    });
}
