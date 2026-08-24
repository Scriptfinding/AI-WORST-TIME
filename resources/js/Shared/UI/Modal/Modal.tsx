import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';
import { useModalLifecycle } from './useModalLifecycle';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    caption?: string;
    headerExtra?: React.ReactNode;
    width?: string;
    fullScreen?: boolean;
    transparentOverlay?: boolean;
    zIndex?: number;
    modalKind?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, caption, headerExtra, width, fullScreen, transparentOverlay, zIndex, modalKind, children, footer }: ModalProps) {
    const mouseDownOnOverlay = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    useModalLifecycle(isOpen, onClose, containerRef);

    if (!isOpen) return null;

    return createPortal(
        <S.Overlay
            data-modal-overlay
            data-modal-kind={modalKind}
            $transparent={transparentOverlay}
            $zIndex={zIndex}
            onMouseDown={e => { mouseDownOnOverlay.current = e.target === e.currentTarget; }}
            onClick={e => { if (e.target === e.currentTarget && mouseDownOnOverlay.current) onClose(); }}
        >
            <S.Container ref={containerRef} tabIndex={-1} $width={width} $fullScreen={fullScreen}>
                <S.Header>
                    <S.TitleGroup>
                        <S.Title>{title}</S.Title>
                        {caption && <S.Caption>{caption}</S.Caption>}
                        {headerExtra && <S.HeaderExtra>{headerExtra}</S.HeaderExtra>}
                    </S.TitleGroup>
                    <S.CloseButton type="button" onClick={onClose}>
                        <Icon icon="lucide:x" width={16} height={16} />
                    </S.CloseButton>
                </S.Header>
                <S.Body $fullScreen={fullScreen}>{children}</S.Body>
                {footer && <S.Footer data-modal-footer>{footer}</S.Footer>}
            </S.Container>
        </S.Overlay>,
        document.body,
    );
}
