import React, { useEffect, useRef, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import * as S from './styled';

export type ConfirmVariant = 'danger' | 'primary';

export interface ConfirmOptions {
    title?: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
    confirmVariant?: 'danger' | 'primary' | 'secondary';
    hideCancel?: boolean;
    additionalAction?: {
        label: string;
        onClick: () => void;
    };
}

interface ConfirmDialogProps extends ConfirmOptions {
    onClose: (result: boolean) => void;
}

export default function ConfirmDialog({
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant = 'danger',
    confirmVariant,
    hideCancel = false,
    additionalAction,
    onClose,
}: ConfirmDialogProps) {
    const mouseDownOnOverlayRef = useRef(false);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose(false);
        };

        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleMouseDown = (event: MouseEvent) => {
        mouseDownOnOverlayRef.current = event.target === event.currentTarget;
    };

    const handleClick = (event: MouseEvent) => {
        if (event.target === event.currentTarget && mouseDownOnOverlayRef.current) {
            onClose(false);
        }
    };

    return createPortal(
        <S.Overlay
            data-modal-overlay
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
            <S.Dialog $variant={variant}>
                <S.DialogHeader>
                    <S.DialogIcon $variant={variant}>
                        <Icon
                            icon={variant === 'danger' ? 'lucide:trash-2' : 'lucide:help-circle'}
                            width={20}
                            height={20}
                        />
                    </S.DialogIcon>
                    <S.DialogTitle>{title || 'Confirm'}</S.DialogTitle>
                    <S.DialogClose onClick={() => onClose(false)}>
                        <Icon icon="lucide:x" width={16} height={16} />
                    </S.DialogClose>
                </S.DialogHeader>
                <S.DialogBody>{message}</S.DialogBody>
                <S.DialogFooter>
                    {!hideCancel && (
                        <Button variant="secondary" size="sm" onClick={() => onClose(false)}>
                            {cancelLabel || 'Cancel'}
                        </Button>
                    )}
                    <Button
                        variant={confirmVariant || (variant === 'danger' ? 'danger' : 'primary')}
                        size="sm"
                        onClick={() => onClose(true)}
                        autoFocus={!additionalAction}
                    >
                        {confirmLabel || 'Confirm'}
                    </Button>
                    {additionalAction && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                                onClose(false);
                                additionalAction.onClick();
                            }}
                            autoFocus
                        >
                            {additionalAction.label}
                        </Button>
                    )}
                </S.DialogFooter>
            </S.Dialog>
        </S.Overlay>,
        document.body,
    );
}
