import React, { useState, useCallback } from 'react';
import ConfirmDialog, { type ConfirmOptions } from './useConfirm/ConfirmDialog/ConfirmDialog';

export {
    ConfirmFlowList,
    ConfirmFlowItem,
    ConfirmationFlowItemLabel,
} from './useConfirm/shared.styled';

interface ConfirmState extends ConfirmOptions {
    resolve: (value: boolean) => void;
}

// Exposes a promise-based confirmation API together with its dialog component.
export function useConfirm() {
    const [state, setState] = useState<ConfirmState | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise(resolve => {
            setState({ ...options, resolve });
        });
    }, []);

    const handleClose = useCallback((result: boolean) => {
        state?.resolve(result);
        setState(null);
    }, [state]);

    const ConfirmModal = useCallback(() => {
        if (!state) return null;

        return (
            <ConfirmDialog
                title={state.title}
                message={state.message}
                confirmLabel={state.confirmLabel}
                cancelLabel={state.cancelLabel}
                variant={state.variant}
                confirmVariant={state.confirmVariant}
                hideCancel={state.hideCancel}
                additionalAction={state.additionalAction}
                onClose={handleClose}
            />
        );
    }, [state, handleClose]);

    return { confirm, ConfirmModal };
}
