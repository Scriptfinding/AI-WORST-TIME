import { router } from '@inertiajs/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { openLibraryStoreQuery, shouldOpenLibraryStoreFromQuery } from '@/Domains/Library/Components/LibraryStoreModal/LibraryStoreModal';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';

interface UseFlowEditorChromeOptions {
    flowId: Id;
    toast: (message: string, variant?: 'success' | 'error' | 'info') => void;
}

// Provides FlowEditor navigation, visibility, library, and overflow controls.
export function useFlowEditorChrome({ flowId, toast }: UseFlowEditorChromeOptions) {
    const modalFlows = useMemo(() => [{ id: flowId }], [flowId]);
    const {
        selectedItem: visibilityFlow,
        openModal: openVisibilityModal,
        closeModal: closeVisibilityModal,
    } = useUrlSyncedModal(modalFlows, 'edit-flow-visibility');
    const setShowVisibilityModal = useCallback((open: boolean) => {
        if (open) {
            openVisibilityModal(modalFlows[0]);
        } else {
            closeVisibilityModal();
        }
    }, [closeVisibilityModal, modalFlows, openVisibilityModal]);
    const showVisibilityModal = visibilityFlow !== null;
    const [showLibraryStore, setShowLibraryStore] = useState(() => shouldOpenLibraryStoreFromQuery());
    const [showOverflow, setShowOverflow] = useState(false);
    const [savingVisibility, setSavingVisibility] = useState(false);
    const overflowRef = useRef<HTMLDivElement>(null);

    useActionMenuDismiss({
        open: showOverflow,
        refs: [overflowRef],
        onDismiss: () => setShowOverflow(false),
        closeOnScroll: false,
        eventType: 'mousedown',
        eventCapture: false,
    });

    const handleVisibilityConfirm = useCallback((data: {
        visibility: 'owner' | 'workspace' | 'team';
        folder_id: Id | null;
        workspace_folder_id: Id | null;
        team_id?: Id | null;
        owner_id?: Id | null;
    }) => {
        setSavingVisibility(true);
        router.put(`/flows/${flowId}/visibility`, data, {
            preserveState: false,
            onFinish: () => {
                setSavingVisibility(false);
                closeVisibilityModal();
            },
        });
    }, [closeVisibilityModal, flowId]);

    const handleLibraryStoreOpen = useCallback(() => {
        openLibraryStoreQuery();
        setShowLibraryStore(true);
    }, []);

    const copyToClipboard = useCallback((text: string) => {
        navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard'));
    }, [toast]);

    return {
        showVisibilityModal,
        setShowVisibilityModal,
        showLibraryStore,
        setShowLibraryStore,
        showOverflow,
        setShowOverflow,
        savingVisibility,
        overflowRef,
        handleVisibilityConfirm,
        handleLibraryStoreOpen,
        copyToClipboard,
    };
}
