import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import {
    RunDetailCopyButton,
    RunDetailPanelHeader,
    RunDetailPanelTitle,
} from '@/Domains/Flow/Pages/FlowEditor/shared/runStatus.styled';
import type { ConsoleLogEntry } from '@/Domains/Flow/types';
import { formatTime } from '@/Shared/Utils/formatDate';
import type { LogLevel } from '@/Domains/Flow/Pages/FlowEditor/types';
import { getVisibleConsoleLogs } from '@/Domains/Flow/Pages/FlowEditor/Modals/RunDetailModal/runProgress';
import * as S from './styled';

interface ConsoleLogViewProps {
    logs: ConsoleLogEntry[];
    onCopy: (text: string) => void;
}

const SCROLL_THRESHOLD = 24;

export default function ConsoleLogView({ logs, onCopy }: ConsoleLogViewProps) {
    const [levelFilter, setLevelFilter] = useState<LogLevel>('all');
    const [query, setQuery] = useState('');
    const visibleLogs = useMemo(() => getVisibleConsoleLogs(logs), [logs]);
    const filtered = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return visibleLogs.filter(log => {
            if (levelFilter !== 'all' && log.level !== levelFilter) return false;
            if (!normalizedQuery) return true;

            return `${formatTime(log.ts)} ${log.level} ${log.message}`
                .toLowerCase()
                .includes(normalizedQuery);
        });
    }, [levelFilter, query, visibleLogs]);
    const counts = useMemo(() => {
        const c = { debug: 0, info: 0, warn: 0, error: 0 };
        visibleLogs.forEach(l => { if (l.level in c) c[l.level as keyof typeof c]++; });
        return c;
    }, [visibleLogs]);

    const containerRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef(true);

    const handleScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_THRESHOLD;
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (el && isAtBottomRef.current) {
            el.scrollTop = el.scrollHeight;
        }
    }, [filtered.length]);

    return (
        <S.ConsoleLogPanel>
            <RunDetailPanelHeader>
                <S.ConsoleToolbar>
                    <RunDetailPanelTitle>Filter</RunDetailPanelTitle>
                    <S.ConsoleFilter value={levelFilter} onChange={e => setLevelFilter(e.target.value as LogLevel)}>
                        <option value="all">All ({visibleLogs.length})</option>
                        <option value="debug">Debug ({counts.debug})</option>
                        <option value="info">Info ({counts.info})</option>
                        <option value="warn">Warn ({counts.warn})</option>
                        <option value="error">Error ({counts.error})</option>
                    </S.ConsoleFilter>
                    <S.ConsoleSearch>
                        <Icon icon="lucide:search" width={11} height={11} />
                        <S.ConsoleSearchInput
                            type="search"
                            value={query}
                            onChange={event => setQuery(event.target.value)}
                            onKeyDown={event => {
                                if (event.key === 'Escape') setQuery('');
                            }}
                            placeholder="Search logs..."
                            aria-label="Search console logs"
                        />
                    </S.ConsoleSearch>
                </S.ConsoleToolbar>
                <RunDetailCopyButton
                    onClick={() => onCopy(filtered.map(l => `[${l.level}] ${l.message}`).join('\n'))}
                >
                    Copy
                </RunDetailCopyButton>
            </RunDetailPanelHeader>
            <S.ConsoleContainer ref={containerRef} onScroll={handleScroll}>
                {filtered.length > 0 ? filtered.map((log, i) => (
                    <S.ConsoleLine key={i} $level={log.level}>
                        <S.ConsoleTimestamp>{formatTime(log.ts)}</S.ConsoleTimestamp>
                        <S.ConsoleLevel $level={log.level}>{log.level}</S.ConsoleLevel>
                        {log.message}
                    </S.ConsoleLine>
                )) : (
                    <S.ConsoleEmpty>No logs matching filter.</S.ConsoleEmpty>
                )}
            </S.ConsoleContainer>
        </S.ConsoleLogPanel>
    );
}
