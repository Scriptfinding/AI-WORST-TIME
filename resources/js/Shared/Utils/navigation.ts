import { router } from '@inertiajs/react';
import type { MouseEvent } from 'react';

/**
 * Handles a click on a navigable element (<a href>).
 * Normal click → Inertia SPA navigation.
 * CMD/CTRL+click, middle-click, shift+click → browser handles it (new tab, etc.).
 */
export function handleLinkClick(e: MouseEvent, url: string, options?: Parameters<typeof router.visit>[1]) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    router.visit(url, options);
}
