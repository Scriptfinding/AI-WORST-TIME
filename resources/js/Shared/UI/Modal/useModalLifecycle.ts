import { useEffect, useRef, type RefObject } from 'react';
import { useBodyScrollLock } from './useBodyScrollLock';

const FOCUSABLE_INPUT_SELECTOR = [
    'input[type="text"]:not([disabled])',
    'input[type="url"]:not([disabled])',
    'input[type="email"]:not([disabled])',
    'input[type="number"]:not([disabled])',
    'input:not([type]):not([disabled])',
].join(', ');

function focusModal(container: HTMLDivElement) {
    const input = container.querySelector<HTMLInputElement>(FOCUSABLE_INPUT_SELECTOR);
    if (input) {
        input.focus();
        return;
    }

    const footerButtons = container.querySelectorAll<HTMLButtonElement>('[data-modal-footer] button:not([disabled])');
    if (footerButtons.length) {
        footerButtons[footerButtons.length - 1].focus();
        return;
    }

    container.focus();
}

// Handles body locking, initial focus, and topmost Escape dismissal for a modal.
export function useModalLifecycle(
    isOpen: boolean,
    onClose: () => void,
    containerRef: RefObject<HTMLDivElement | null>,
) {
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;

            const overlays = document.querySelectorAll('[data-modal-overlay]');
            const topOverlay = overlays[overlays.length - 1];
            const container = containerRef.current;

            if (topOverlay && container && topOverlay.contains(container)) {
                onCloseRef.current();
            }
        };

        document.addEventListener('keydown', handleEscape);
        const focusFrame = window.requestAnimationFrame(() => {
            const container = containerRef.current;
            if (container) focusModal(container);
        });

        return () => {
            document.removeEventListener('keydown', handleEscape);
            window.cancelAnimationFrame(focusFrame);
        };
    }, [isOpen, containerRef]);
}
