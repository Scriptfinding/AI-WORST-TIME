import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import type { Flow } from '@/Domains/Flow/types';
import type { FlowVisibilityData } from '@/Domains/Flow/Components/Flow/FlowCard/types';

// Centralizes FlowCard menu, modal, deletion, and visibility-update behavior.
export function useFlowCardController(flow: Flow) {
    const [menuOpen, setMenuOpen] = useState(false);
    const modalFlows = useMemo(() => [flow], [flow]);
    const {
        selectedItem: visibilityFlow,
        openModal: openVisibilityModal,
        closeModal: closeVisibility,
    } = useUrlSyncedModal(modalFlows, 'edit-flow-visibility-card');
    const {
        selectedItem: moveFlow,
        openModal: openMoveModal,
        closeModal: closeMove,
    } = useUrlSyncedModal(modalFlows, 'edit-flow-location-card');
    const [showDuplicate, setShowDuplicate] = useState(false);
    const [savingVisibility, setSavingVisibility] = useState(false);
    const { confirm, ConfirmModal } = useConfirm();

    const openVisibility = () => {
        setMenuOpen(false);
        openVisibilityModal(flow);
    };

    const openMove = () => {
        setMenuOpen(false);
        openMoveModal(flow);
    };

    const openDuplicate = () => {
        setMenuOpen(false);
        setShowDuplicate(true);
    };

    const deleteFlow = async () => {
        setMenuOpen(false);
        const confirmed = await confirm({
            title: 'Delete Flow',
            message: `Are you sure you want to delete "${flow.name}"? All runs, recordings, screenshots and downloads will be permanently lost.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });

        if (!confirmed) return;

        router.delete(`/flows/${flow.id}`, {
            data: { redirect_url: window.location.pathname + window.location.search },
            preserveState: false,
        });
    };

    const updateVisibility = (data: FlowVisibilityData) => {
        setSavingVisibility(true);
        router.put(`/flows/${flow.id}/visibility`, { ...data }, {
            preserveState: false,
            onFinish: () => {
                setSavingVisibility(false);
                closeVisibility();
            },
        });
    };

    return {
        menuOpen,
        setMenuOpen,
        showVisibility: visibilityFlow !== null,
        closeVisibility,
        showMove: moveFlow !== null,
        closeMove,
        showDuplicate,
        closeDuplicate: () => setShowDuplicate(false),
        savingVisibility,
        openVisibility,
        openMove,
        openDuplicate,
        deleteFlow,
        updateVisibility,
        ConfirmModal,
    };
}

export type FlowCardController = ReturnType<typeof useFlowCardController>;
