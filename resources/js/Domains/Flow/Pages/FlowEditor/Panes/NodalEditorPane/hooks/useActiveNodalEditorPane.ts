import { useCallback, useEffect, useRef } from 'react';

let activeNodalEditorPaneId: string | null = null;

// Tracks whether this nodal editor owns global keyboard and clipboard shortcuts.
export function useActiveNodalEditorPane() {
    const paneIdRef = useRef(`nodal-pane-${Math.random().toString(36).slice(2)}`);

    const activatePane = useCallback(() => {
        activeNodalEditorPaneId = paneIdRef.current;
    }, []);
    const isActivePane = useCallback(() => activeNodalEditorPaneId === paneIdRef.current, []);
    const isAnotherPaneActive = useCallback(
        () => Boolean(activeNodalEditorPaneId && activeNodalEditorPaneId !== paneIdRef.current),
        [],
    );

    useEffect(() => {
        const paneId = paneIdRef.current;
        return () => {
            if (activeNodalEditorPaneId === paneId) {
                activeNodalEditorPaneId = null;
            }
        };
    }, []);

    return {
        activatePane,
        isActivePane,
        isAnotherPaneActive,
    };
}
