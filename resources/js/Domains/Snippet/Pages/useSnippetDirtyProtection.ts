import { useCallback, useEffect, useRef, useState } from 'react';
import { useBeforeUnloadProtection } from '@/Shared/Hooks/useBeforeUnloadProtection';

interface Options {
    dirty: boolean;
}

// Protects unsaved snippet edits and routes keyboard saves through the controller.
export function useSnippetDirtyProtection({ dirty }: Options) {
    const [justSaved, setJustSaved] = useState(false);
    const justSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveRef = useRef<() => Promise<boolean>>(async () => false);
    const savingRef = useRef(false);

    const markJustSaved = useCallback(() => {
        setJustSaved(true);
        if (justSavedTimer.current) clearTimeout(justSavedTimer.current);
        justSavedTimer.current = setTimeout(() => setJustSaved(false), 2500);
    }, []);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 's') {
                event.preventDefault();
                if (dirty && !savingRef.current) saveRef.current();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [dirty]);

    useBeforeUnloadProtection({ active: dirty });

    useEffect(() => {
        return () => {
            if (justSavedTimer.current) clearTimeout(justSavedTimer.current);
        };
    }, []);

    return { justSaved, markJustSaved, saveRef, savingRef };
}
