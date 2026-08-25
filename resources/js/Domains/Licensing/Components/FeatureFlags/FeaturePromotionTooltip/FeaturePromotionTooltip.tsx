import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/Shared/UI/Icon/Icon';
import MessageContent from '../FeatureUnavailablePanel/MessageContent/MessageContent';
import * as S from './styled';

type Placement = 'top' | 'right';

interface Props {
    children: ReactNode;
    message: string;
    placement?: Placement;
}

export default function FeaturePromotionTooltip({
    children,
    message,
    placement = 'top',
}: Props) {
    const triggerRef = useRef<HTMLDivElement>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

    const cancelHide = () => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    const show = () => {
        cancelHide();
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPosition(placement === 'right'
            ? { left: rect.right + 8, top: rect.top + rect.height / 2 }
            : { left: rect.left + rect.width / 2, top: rect.top - 8 });
    };
    const hide = () => {
        hideTimer.current = setTimeout(() => setPosition(null), 80);
    };

    const tooltip = position && typeof document !== 'undefined'
        ? createPortal(
            <S.Tooltip
                role="tooltip"
                $placement={placement}
                style={position}
                onMouseEnter={cancelHide}
                onMouseLeave={hide}
            >
                <S.IconWrap>
                    <Icon icon="lucide:lock" width={14} />
                </S.IconWrap>
                <S.Message>
                    <MessageContent message={message} />
                </S.Message>
            </S.Tooltip>,
            document.body,
        )
        : null;

    return (
        <S.Trigger
            ref={triggerRef}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            {tooltip}
        </S.Trigger>
    );
}
