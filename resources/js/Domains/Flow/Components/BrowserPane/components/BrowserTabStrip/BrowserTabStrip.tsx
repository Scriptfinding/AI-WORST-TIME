import { useEffect, useRef } from 'react';
import * as S from './styled';

interface BrowserTabStripProps {
    activeTabName: string | null;
    canControl: boolean;
    showCanvas: boolean;
    tabs: string[];
    onSelect: (tabName: string) => void;
}

export default function BrowserTabStrip({
    activeTabName,
    canControl,
    showCanvas,
    tabs,
    onSelect,
}: BrowserTabStripProps) {
    const activeTabRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        activeTabRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
        });
    }, [activeTabName]);

    if (!showCanvas || tabs.length === 0) return null;

    return (
        <S.TabStrip aria-label="Browser tabs">
            {tabs.map(tabName => {
                const active = tabName === activeTabName;
                return (
                    <S.TabButton
                        key={tabName}
                        ref={active ? activeTabRef : undefined}
                        type="button"
                        $active={active}
                        aria-current={active ? 'page' : undefined}
                        disabled={!canControl}
                        title={canControl ? `Switch to ${tabName}` : tabName}
                        onClick={() => {
                            if (!active) onSelect(tabName);
                        }}
                    >
                        <span>{tabName}</span>
                    </S.TabButton>
                );
            })}
        </S.TabStrip>
    );
}
