import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import StatsGrid, { type StatItem } from '@/Shared/UI/StatsGrid/StatsGrid';
import RunDetailModal from '@/Domains/Flow/Pages/FlowEditor/Modals/RunDetailModal/RunDetailModal';
import { useSyncedRunDetail } from '@/Domains/Flow/Hooks/Run/useSyncedRunDetail';
import { useOptimisticRunCancellation } from '@/Domains/Flow/Hooks/Run/useOptimisticRunCancellation';
import { useToast } from '@/App/Hooks/useToast';
import { useRunAgainModal } from '@/Domains/Flow/Hooks/useRunAgainModal';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import type { FlowRun } from '@/Domains/Flow/types';
import RunsFilters, { type RunsFiltersHandle } from './components/RunsFilters/RunsFilters';
import RunsSection from './components/RunsSection/RunsSection';
import { useBatchRunDeletion } from './hooks/useBatchRunDeletion';
import { useRunSelection } from './hooks/useRunSelection';
import { useRunsPolling } from './hooks/useRunsPolling';
import type { RunsProps } from './types';
import * as S from './styled';

export default function Runs({ runningRuns, terminatedRuns, runUsers, stats, concurrentRunsLimit, filters }: RunsProps) {
    const { toast } = useToast();
    const { openRunAgainModal, runAgainModal } = useRunAgainModal();
    const [detailRun, setDetailRun] = useState<FlowRun | null>(null);
    const [loading, setLoading] = useState(false);
    const [perPage, setPerPage] = useState(filters.per_page ?? 50);
    const filtersRef = useRef<RunsFiltersHandle>(null);
    const allRuns = useMemo(() => [...runningRuns.data, ...terminatedRuns.data], [runningRuns.data, terminatedRuns.data]);
    const {
        displayedRuns: displayedAllRuns,
        markRunCancelled,
        rollbackRunCancellation,
    } = useOptimisticRunCancellation(allRuns);
    const displayedRunsById = useMemo(
        () => new Map(displayedAllRuns.map(run => [run.id, run])),
        [displayedAllRuns],
    );
    const displayedRunningRuns = useMemo(() => ({
        ...runningRuns,
        data: runningRuns.data.map(run => displayedRunsById.get(run.id) ?? run),
    }), [displayedRunsById, runningRuns]);
    const displayedTerminatedRuns = useMemo(() => ({
        ...terminatedRuns,
        data: terminatedRuns.data.map(run => displayedRunsById.get(run.id) ?? run),
    }), [displayedRunsById, terminatedRuns]);
    const {
        selectedRunIds,
        selectedRunningRuns,
        selectedTerminatedRuns,
        toggleRunSelection,
        toggleVisibleRunSelection,
        clearRunSelection,
        removeRunIdsFromSelection,
    } = useRunSelection(runningRuns.data, terminatedRuns.data);
    const waitingHumanIds = useRunsPolling(allRuns, runningRuns.data.length);
    const { deletingSelected, deleteSelectedRuns, ConfirmModal } = useBatchRunDeletion(removeRunIdsFromSelection);

    useSyncedRunDetail(displayedAllRuns, detailRun, setDetailRun);

    const handleKillRun = useCallback((run: FlowRun) => {
        if (!run.flow) return;
        markRunCancelled(run.id);
        router.post(`/flows/${run.flow.id}/runs/${run.id}/kill`, {}, {
            preserveState: true,
            onError: () => rollbackRunCancellation(run.id),
        });
    }, [markRunCancelled, rollbackRunCancellation]);

    const statItems: StatItem[] = [
        { label: 'Runs', value: stats.total, icon: 'lucide:play', color: '#3b82f6' },
        { label: 'Running', value: stats.running, icon: 'lucide:loader-2', color: '#3b82f6' },
        { label: 'Pending', value: stats.pending, icon: 'lucide:clock', color: '#f59e0b' },
        ...(concurrentRunsLimit >= 0 ? [{ label: 'Capacity', value: `${stats.running} / ${concurrentRunsLimit}`, icon: 'lucide:gauge', color: '#8b5cf6' }] : []),
        { label: 'Success', value: stats.success, icon: 'lucide:check-circle', color: '#22c55e' },
        { label: 'Failed', value: stats.error, icon: 'lucide:x-circle', color: '#ef4444' },
        { label: 'Cancelled', value: stats.cancelled, icon: 'lucide:ban', color: '#71717a' },
    ];
    const changePerPage = (value: number) => filtersRef.current?.changePerPage(value);
    const sectionProps = {
        selectedRunIds,
        waitingHumanIds,
        loading,
        deleting: deletingSelected,
        perPage,
        onPerPageChange: changePerPage,
        onOpen: setDetailRun,
        onToggleSelect: toggleRunSelection,
        onToggleVisible: toggleVisibleRunSelection,
        onClearSelection: clearRunSelection,
        onDeleteSelected: deleteSelectedRuns,
        onKill: handleKillRun,
    };

    return (
        <AppLayout title="Runs">
            <StatsGrid items={statItems} />
            <RunsFilters
                ref={filtersRef}
                filters={filters}
                runUsers={runUsers}
                perPage={perPage}
                onPerPageChange={setPerPage}
                onLoadingChange={setLoading}
            />
            <RunsSection
                {...sectionProps}
                title="Running runs"
                runs={displayedRunningRuns}
                pageName="running_page"
                selectedRuns={selectedRunningRuns}
            />
            <RunsSection
                {...sectionProps}
                title="Terminated runs"
                runs={displayedTerminatedRuns}
                pageName="terminated_page"
                selectedRuns={selectedTerminatedRuns}
            />
            {runningRuns.total === 0 && terminatedRuns.total === 0 && (
                <S.EmptyState>No runs found for the current filters.</S.EmptyState>
            )}
            <RunDetailModal
                run={detailRun}
                onClose={() => setDetailRun(null)}
                flowId={detailRun?.flow?.id ?? ''}
                flowName={detailRun?.flow?.name}
                flowIcon={detailRun?.flow}
                timeoutSeconds={detailRun?.flow?.timeout_seconds}
                copyToClipboard={text => navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard'))}
                onKill={handleKillRun}
                onRerun={openRunAgainModal}
                navigationRuns={displayedAllRuns}
                onNavigate={setDetailRun}
                footerExtra={detailRun?.flow ? (
                    <S.FlowLinkButton
                        href={`/flows/${detailRun.flow.id}`}
                        onClick={event => handleLinkClick(event, `/flows/${detailRun.flow?.id}`)}
                    >
                        <Icon icon="lucide:inspect" width={14} height={14} />
                        Go to flow
                    </S.FlowLinkButton>
                ) : undefined}
            />
            {runAgainModal}
            <ConfirmModal />
        </AppLayout>
    );
}
