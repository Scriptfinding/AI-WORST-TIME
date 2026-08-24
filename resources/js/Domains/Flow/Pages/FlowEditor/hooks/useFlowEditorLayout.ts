import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { TabKey } from '@/Domains/Flow/Pages/FlowEditor/types';
import { getTabFromHash } from '@/Domains/Flow/Pages/FlowEditor/utils/tabs';

// Persists the editor's tab, pane, and sidebar layout preferences across visits.
export function useFlowEditorLayout() {
    const [activeTab, setActiveTab] = useState<TabKey>(getTabFromHash);
    const [leftView, setLeftView] = useState<'welcome' | 'code'>(() => {
        if (window.location.hash === '#code') return 'code';

        const stored = localStorage.getItem('flow-editor-left-view');
        return stored === 'code' ? 'code' : 'welcome';
    });
    const [sidePanelOpen, setSidePanelOpen] = useState(() => {
        return localStorage.getItem('flow-editor-side-panel') !== 'closed';
    });
    const [sidePanelWidth, setSidePanelWidth] = useState(() => {
        const stored = Number(localStorage.getItem('flow-editor-side-panel-width'));
        return Number.isFinite(stored) && stored >= 360 ? stored : 540;
    });

    const editorContainerRef = useRef<HTMLDivElement>(null);
    const sidePanelResizingRef = useRef(false);
    const sidePanelResizeCleanupRef = useRef<(() => void) | null>(null);
    const settingsScrollToRef = useRef<string | null>(null);

    const changeLeftView = useCallback((view: 'welcome' | 'code') => {
        setLeftView(view);
        localStorage.setItem('flow-editor-left-view', view);
    }, []);

    const toggleSidePanel = useCallback(() => {
        setSidePanelOpen(prev => {
            const next = !prev;
            localStorage.setItem('flow-editor-side-panel', next ? 'open' : 'closed');
            return next;
        });
    }, []);

    const handleSidePanelResizeStart = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        sidePanelResizingRef.current = true;
        const previousCursor = document.body.style.cursor;
        const previousUserSelect = document.body.style.userSelect;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const handleMove = (moveEvent: MouseEvent) => {
            if (!sidePanelResizingRef.current || !editorContainerRef.current) return;

            const rect = editorContainerRef.current.getBoundingClientRect();
            const maxWidth = Math.max(360, Math.min(860, rect.width - 420));
            const nextWidth = Math.max(360, Math.min(maxWidth, rect.right - moveEvent.clientX));
            setSidePanelWidth(nextWidth);
        };

        const cleanup = () => {
            sidePanelResizingRef.current = false;
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.body.style.cursor = previousCursor;
            document.body.style.userSelect = previousUserSelect;
            sidePanelResizeCleanupRef.current = null;
        };

        const handleUp = () => {
            cleanup();
            setSidePanelWidth(width => {
                localStorage.setItem('flow-editor-side-panel-width', String(Math.round(width)));
                return width;
            });
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        sidePanelResizeCleanupRef.current = cleanup;
    }, []);

    const switchTab = useCallback((tab: TabKey) => {
        setActiveTab(tab);
        localStorage.setItem('flow-editor-tab', tab);
        window.history.replaceState(null, '', `#${tab}`);
    }, []);

    const switchToCode = useCallback(() => {
        changeLeftView('code');
        if (activeTab !== 'code') switchTab('code');
    }, [activeTab, switchTab, changeLeftView]);

    const switchToSettings = useCallback((scrollTo?: string) => {
        settingsScrollToRef.current = scrollTo || null;
        switchTab('settings');
    }, [switchTab]);

    useEffect(() => {
        const onHashChange = () => setActiveTab(getTabFromHash());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    useEffect(() => () => sidePanelResizeCleanupRef.current?.(), []);

    const sideTab = activeTab === 'code' ? 'info' : activeTab;

    return {
        activeTab,
        leftView,
        sidePanelOpen,
        sidePanelWidth,
        sideTab,
        editorContainerRef,
        settingsScrollToRef,
        changeLeftView,
        toggleSidePanel,
        handleSidePanelResizeStart,
        switchTab,
        switchToCode,
        switchToSettings,
    };
}
