import React, { useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
import * as S from './styled';

const VIEWPORT_MARGIN = 8;

interface Props {
    children: React.ReactNode;
}

export default function SidebarOverflow({ children }: Props) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useActionMenuDismiss({
        open,
        refs: [menuRef, buttonRef],
        onDismiss: () => setOpen(false),
        closeOnScroll: false,
        eventType: 'mousedown',
        eventCapture: false,
        requireAllRefs: true,
    });

    const handleOpen = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({ top: rect.bottom + 2, left: rect.left });
        }
        setOpen((previous) => !previous);
    };

    // The menu is portaled with a fixed position below the button; when the
    // button sits near the bottom of the viewport, reposition it above.
    useLayoutEffect(() => {
        if (!open) return;
        const menu = menuRef.current;
        const anchor = buttonRef.current;
        if (!menu || !anchor) return;

        const menuRect = menu.getBoundingClientRect();
        if (menuRect.bottom <= window.innerHeight - VIEWPORT_MARGIN) return;

        const anchorRect = anchor.getBoundingClientRect();
        setPosition((previous) => ({
            ...previous,
            top: Math.max(VIEWPORT_MARGIN, anchorRect.top - menuRect.height - 2),
        }));
    }, [open]);

    return (
        <S.Wrapper>
            <S.Button ref={buttonRef} onClick={handleOpen}>
                <Icon icon="lucide:ellipsis" />
            </S.Button>
            {open && ReactDOM.createPortal(
                <S.Menu
                    ref={menuRef}
                    style={position}
                    onClick={() => setOpen(false)}
                >
                    {children}
                </S.Menu>,
                document.body,
            )}
        </S.Wrapper>
    );
}
