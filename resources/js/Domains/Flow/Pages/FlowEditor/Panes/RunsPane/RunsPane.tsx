import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import { useWaitingHumanSet } from '@/Domains/Flow/Hooks/useWaitingHuman';
import * as Layout from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import { RUN_PER_PAGE_OPTIONS } from '@/Domains/Flow/Pages/runHistory';
import type { Flow, FlowRun } from '@/Domains/Flow/types';
import type { PaginatedData } from '@/Shared/Types/pagination';
import RunHistoryItem from './components/RunHistoryItem';
import RunMetadataPopover from './components/RunMetadataPopover';
import RunsPaneFilters, {
    type RunsPaneFiltersHandle,
} from './components/RunsPaneFilters/RunsPaneFilters';
import RunsPanePagination from './components/RunsPanePagination';
import * as S from './styled';

const PER_PAGE_STORAGE_KEY = 'runs_per_page';

function getStoredPerPage(): number {
    try {
        const value = parseInt(localStorage.getItem(PER_PAGE_STORAGE_KEY) ?? '', 10);
        return (RUN_PER_PAGE_OPTIONS as readonly number[]).includes(value)
            ? value
            : RUN_PER_PAGE_OPTIONS[0];
    } catch {
        return RUN_PER_PAGE_OPTIONS[0];
    }
}

interface RunsPaneProps {
    flow: Flow;
    runs: PaginatedData<FlowRun>;
    running: boolean;
    onRunNow: () => void;
    onViewRunDetails: (run: FlowRun) => void;
    onKillRun: (run: FlowRun) => void;
    onClearAll: () => void;
    onDeleteSelected: (ids: number[]) => void;
    clearing: boolean;
    canEdit?: boolean;
}

export default function RunsPane({
    flow,
    runs,
    running,
    onRunNow,
    onViewRunDetails,
    onKillRun,
    onClearAll,
    onDeleteSelected,
    clearing,
    canEdit = true,
}: RunsPaneProps) {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [filtersLoading, setFiltersLoading] = useState(false);
    const [perPage, setPerPage] = useState(getStoredPerPage);
    const [metaPopoverRunId, setMetaPopoverRunId] = useState<number | null>(null);
    const [metaTriggerRect, setMetaTriggerRect] = useState<DOMRect | null>(null);
    const filtersRef = useRef<RunsPaneFiltersHandle>(null);
    const waitingHumanIds = useWaitingHumanSet(
        runs.data
            .filter(run => run.status === 'running')
            .map(run => ({ id: run.id, flowId: flow.id })),
    );

    useEffect(() => {
        setSelectedIds(previous => {
            const currentIds = new Set(runs.data.map(run => run.id));
            const filtered = new Set([...previous].filter(id => currentIds.has(id)));
            return filtered.size === previous.size ? previous : filtered;
        });
    }, [runs.data]);

    const toggleSelection = (runId: number, event: MouseEvent) => {
        event.stopPropagation();
        setSelectedIds(previous => {
            const next = new Set(previous);
            if (next.has(runId)) next.delete(runId);
            else next.add(runId);
            return next;
        });
    };

    const changePerPage = (value: number) => {
        setPerPage(value);
        try {
            localStorage.setItem(PER_PAGE_STORAGE_KEY, String(value));
        } catch {
            // Local storage may be unavailable in private browsing contexts.
        }
    };

    const openMetaPopover = (runId: number, trigger: HTMLElement) => {
        if (metaPopoverRunId === runId) {
            setMetaPopoverRunId(null);
            setMetaTriggerRect(null);
            return;
        }
        setMetaPopoverRunId(runId);
        setMetaTriggerRect(trigger.getBoundingClientRect());
    };

    const closeMetaPopover = () => {
        setMetaPopoverRunId(null);
        setMetaTriggerRect(null);
    };

    const popoverRun = metaPopoverRunId
        ? runs.data.find(run => run.id === metaPopoverRunId) ?? null
        : null;

    return (
        <>
            <Layout.SidePanelSection>
                <Layout.SidePanelSectionInner>
                    <Layout.SectionTitle>Run History</Layout.SectionTitle>
                    <S.RunNowWrapper>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onRunNow}
                            loading={running}
                        >
                            {running ? 'Running...' : 'Run Now'}
                        </Button>
                        {canEdit && runs.total > 0 && selectedIds.size > 0 ? (
                            <>
                                <S.DeleteSelectedButton
                                    onClick={() => {
                                        onDeleteSelected([...selectedIds]);
                                        setSelectedIds(new Set());
                                    }}
                                    disabled={clearing}
                                >
                                    <Icon
                                        icon={clearing ? 'lucide:loader-2' : 'lucide:trash-2'}
                                        width={13}
                                        height={13}
                                        className={clearing ? 'spin' : undefined}
                                    />
                                    Delete {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''}
                                </S.DeleteSelectedButton>
                                {!clearing && (
                                    <S.ClearSelectedButton onClick={() => setSelectedIds(new Set())}>
                                        <Icon icon="lucide:x" width={13} height={13} />
                                    </S.ClearSelectedButton>
                                )}
                            </>
                        ) : canEdit && runs.total > 0 ? (
                            <S.ClearAllButton
                                onClick={onClearAll}
                                disabled={clearing}
                                title="Clear all run history"
                            >
                                <Icon
                                    icon={clearing ? 'lucide:loader-2' : 'lucide:trash-2'}
                                    width={13}
                                    height={13}
                                    className={clearing ? 'spin' : undefined}
                                />
                            </S.ClearAllButton>
                        ) : null}
                    </S.RunNowWrapper>

                    <RunsPaneFilters
                        ref={filtersRef}
                        perPage={perPage}
                        onLoadingChange={setFiltersLoading}
                    />
                    <RunsPanePagination
                        runs={runs}
                        position="top"
                        perPage={perPage}
                        onPerPageChange={value => {
                            changePerPage(value);
                            filtersRef.current?.changePerPage(value);
                        }}
                    />

                    <S.RunListLoadingWrap>
                        {filtersLoading && (
                            <S.RunListLoading>
                                <Icon icon="lucide:loader" width={18} height={18} />
                            </S.RunListLoading>
                        )}
                        {runs.data.length > 0 ? (
                            <S.RunList $dimmed={filtersLoading}>
                                {runs.data.map(run => (
                                    <RunHistoryItem
                                        key={run.id}
                                        run={run}
                                        selected={selectedIds.has(run.id)}
                                        selectable={canEdit}
                                        waitingHuman={waitingHumanIds.has(run.id)}
                                        onOpen={onViewRunDetails}
                                        onToggleSelection={toggleSelection}
                                        onKill={onKillRun}
                                        onOpenMetadata={openMetaPopover}
                                    />
                                ))}
                            </S.RunList>
                        ) : (
                            <Layout.RunListEmpty>
                                <Layout.EmptyText>No runs yet</Layout.EmptyText>
                            </Layout.RunListEmpty>
                        )}
                    </S.RunListLoadingWrap>

                    <RunsPanePagination
                        runs={runs}
                        position="bottom"
                        perPage={perPage}
                        onPerPageChange={value => {
                            changePerPage(value);
                            filtersRef.current?.changePerPage(value);
                        }}
                    />
                </Layout.SidePanelSectionInner>
            </Layout.SidePanelSection>
            <RunMetadataPopover
                run={popoverRun}
                triggerRect={metaTriggerRect}
                onClose={closeMetaPopover}
            />
        </>
    );
}
