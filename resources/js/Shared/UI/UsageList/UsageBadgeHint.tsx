import React, { useCallback, useRef } from 'react';
import {
    UsageBadgeHintDot,
    UsageBadgeHintPopover,
    UsageBadgeHintWrap,
} from './UsageBadgeHint.styled';

export function UsageBadgeHint({ children }: { children: React.ReactNode }) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const position = useCallback(() => {
        const dot = wrapRef.current;
        const popover = popoverRef.current;
        if (!dot || !popover) return;

        const rect = dot.getBoundingClientRect();
        popover.style.left = `${rect.left + rect.width / 2}px`;
        popover.style.top = `${rect.top - 6}px`;
        popover.style.transform = 'translate(-50%, -100%)';
    }, []);

    return (
        <UsageBadgeHintWrap ref={wrapRef} onMouseEnter={position}>
            <UsageBadgeHintDot>?</UsageBadgeHintDot>
            <UsageBadgeHintPopover ref={popoverRef}>{children}</UsageBadgeHintPopover>
        </UsageBadgeHintWrap>
    );
}
