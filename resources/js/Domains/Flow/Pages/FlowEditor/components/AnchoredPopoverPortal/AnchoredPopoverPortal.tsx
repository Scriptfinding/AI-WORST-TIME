import {
    useRef,
    type CSSProperties,
    type MouseEventHandler,
    type ReactNode,
    type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useClickOutside } from '@/Shared/Hooks/useClickOutside';

interface AnchoredPopoverBindings {
    ref: RefObject<HTMLDivElement | null>;
    style: CSSProperties;
    onClick: MouseEventHandler<HTMLDivElement>;
    onMouseDown: MouseEventHandler<HTMLDivElement>;
}

interface AnchoredPopoverPortalProps {
    open: boolean;
    triggerRect: DOMRect | null;
    position: (triggerRect: DOMRect) => CSSProperties;
    onClose: () => void;
    children: (bindings: AnchoredPopoverBindings) => ReactNode;
}

export default function AnchoredPopoverPortal({
    open,
    triggerRect,
    position,
    onClose,
    children,
}: AnchoredPopoverPortalProps) {
    const popoverRef = useRef<HTMLDivElement>(null);

    useClickOutside({
        refs: [popoverRef],
        onOutside: onClose,
        enabled: open && triggerRect !== null,
        eventType: 'mousedown',
    });

    if (!open || !triggerRect) return null;

    return createPortal(
        children({
            ref: popoverRef,
            style: position(triggerRect),
            onClick: event => event.stopPropagation(),
            onMouseDown: event => event.stopPropagation(),
        }),
        document.body,
    );
}
