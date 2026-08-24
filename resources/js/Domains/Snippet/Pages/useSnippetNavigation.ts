import { useCallback, useEffect, useRef, useState } from 'react';
import type { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { Snippet } from '@/Domains/Snippet/types';
import type { SnippetFormController } from './useSnippetForm';

type Confirm = ReturnType<typeof useConfirm>['confirm'];
export type SnippetMobileView = 'list' | 'settings' | 'editor';

interface Options {
    initialSnippets: Snippet[];
    confirm: Confirm;
    form: SnippetFormController;
    save: () => Promise<boolean>;
}

// Handles guarded snippet switching, mobile panes, and URL selection state.
export function useSnippetNavigation({ initialSnippets, confirm, form, save }: Options) {
    const { clearActive, dirtyRef, syncFormState } = form;
    const [switching, setSwitching] = useState(false);
    const [mobileView, setMobileView] = useState<SnippetMobileView>('list');
    const [settingsCollapsed, setSettingsCollapsed] = useState(() => {
        try {
            return localStorage.getItem('snippet-settings-collapsed') === '1';
        } catch {
            return false;
        }
    });
    const switchingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const doLoadSnippet = useCallback((snippet: Snippet) => {
        if (switchingTimer.current) clearTimeout(switchingTimer.current);
        setSwitching(true);
        syncFormState(snippet);
        setMobileView('editor');
        const url = new URL(window.location.href);
        url.searchParams.set('s', String(snippet.id));
        window.history.replaceState(null, '', url.toString());
        switchingTimer.current = setTimeout(() => setSwitching(false), 150);
    }, [syncFormState]);

    const loadSnippet = useCallback(async (snippet: Snippet) => {
        if (dirtyRef.current) {
            const ok = await confirm({
                title: 'Unsaved changes',
                message: 'You have unsaved changes. Save or discard them before switching snippets.',
                confirmLabel: 'Discard Changes',
                variant: 'danger',
                confirmVariant: 'secondary',
                hideCancel: true,
                additionalAction: {
                    label: 'Save',
                    onClick: async () => {
                        if (await save()) doLoadSnippet(snippet);
                    },
                },
            });
            if (!ok) return;
        }
        doLoadSnippet(snippet);
    }, [confirm, dirtyRef, doLoadSnippet, save]);

    const clearActiveSnippet = useCallback(() => {
        clearActive();
        const url = new URL(window.location.href);
        url.searchParams.delete('s');
        window.history.replaceState(null, '', url.toString());
    }, [clearActive]);

    const toggleSettingsCollapsed = useCallback(() => {
        setSettingsCollapsed(previous => {
            const next = !previous;
            try {
                localStorage.setItem('snippet-settings-collapsed', next ? '1' : '0');
            } catch {
                // Keep the in-memory preference when storage is unavailable.
            }
            return next;
        });
    }, []);

    useEffect(() => {
        const id = new URLSearchParams(window.location.search).get('s');
        if (!id) return;
        const found = initialSnippets.find(snippet => String(snippet.id) === id);
        if (found) doLoadSnippet(found);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        return () => {
            if (switchingTimer.current) clearTimeout(switchingTimer.current);
        };
    }, []);

    return {
        switching,
        mobileView,
        setMobileView,
        settingsCollapsed,
        toggleSettingsCollapsed,
        doLoadSnippet,
        loadSnippet,
        clearActiveSnippet,
    };
}
