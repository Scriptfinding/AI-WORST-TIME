import { useState } from 'react';
import { createPortal } from 'react-dom';
import * as S from './styled';

interface TooltipState {
    label: string;
    left: number;
    top: number;
}

// Positions and exposes the overflow title tooltip used by snippet list items.
export function useTitleTooltip() {
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);

    const showTooltip = (label: string, target: HTMLElement) => {
        const rect = target.getBoundingClientRect();
        setTooltip({
            label,
            left: Math.min(rect.left, window.innerWidth - 280),
            top: rect.bottom + 8,
        });
    };

    const hideTooltip = () => setTooltip(null);

    return { hideTooltip, showTooltip, tooltip };
}

interface TitleTooltipPortalProps {
    tooltip: TooltipState | null;
}

export default function TitleTooltipPortal({ tooltip }: TitleTooltipPortalProps) {
    if (!tooltip) return null;

    return createPortal(
        <S.Tooltip style={{ left: tooltip.left, top: tooltip.top }}>
            {tooltip.label}
        </S.Tooltip>,
        document.body,
    );
}
