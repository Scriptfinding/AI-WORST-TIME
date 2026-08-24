import { useEffect } from 'react';
import { usePageProps } from '@/App/Hooks/usePageProps';

const APP_TITLE = 'Puppetflow';

export function formatDocumentTitle(title?: string | null, appTitle = APP_TITLE) {
    const normalized = title?.trim();
    const normalizedAppTitle = appTitle.trim() || APP_TITLE;

    if (!normalized || normalized === normalizedAppTitle) {
        return normalizedAppTitle;
    }

    return `${normalized} · ${normalizedAppTitle}`;
}

// Applies the branded browser title whenever a page title changes.
export function usePageTitle(title?: string | null, enabled = true) {
    const { branding } = usePageProps();

    useEffect(() => {
        if (!enabled) return;

        document.title = formatDocumentTitle(title, branding.name);
    }, [branding.name, enabled, title]);
}
