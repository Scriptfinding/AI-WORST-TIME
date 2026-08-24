import { useState, useCallback, useMemo } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import Button from '@/Shared/UI/Button/Button';
import { openLibraryStoreQuery, shouldOpenLibraryStoreFromQuery } from '@/Domains/Library/Components/LibraryStoreModal/LibraryStoreModal';
import { useInertiaPolling } from '@/Shared/Hooks/useInertiaPolling';
import { useSyncedRunDetail } from '@/Domains/Flow/Hooks/Run/useSyncedRunDetail';
import { useOptimisticRunCancellation } from '@/Domains/Flow/Hooks/Run/useOptimisticRunCancellation';
import { useWaitingHumanSet } from '@/Domains/Flow/Hooks/useWaitingHuman';
import type { Flow, FlowRun } from '@/Domains/Flow/types';
import DashboardStats, { type DashboardStatsData } from './components/DashboardStats/DashboardStats';
import RecentFlows from './components/RecentFlows/RecentFlows';
import DashboardRuns from './components/DashboardRuns/DashboardRuns';
import DashboardModals from './components/DashboardModals/DashboardModals';
import * as S from './styled';

interface Props {
    stats: DashboardStatsData;
    recentRuns: FlowRun[];
    runningRuns: FlowRun[];
    recentFlows: Flow[];
}

export default function Dashboard({ stats, recentRuns, runningRuns, recentFlows }: Props) {
    const [detailRun, setDetailRun] = useState<FlowRun | null>(null);
    const [showLibraryStore, setShowLibraryStore] = useState(() => shouldOpenLibraryStoreFromQuery());
    const [showImportModal, setShowImportModal] = useState(false);

    const allRuns = useMemo(() => [...runningRuns, ...recentRuns], [runningRuns, recentRuns]);
    const {
        displayedRuns: displayedAllRuns,
        markRunCancelled,
        rollbackRunCancellation,
    } = useOptimisticRunCancellation(allRuns);
    const displayedRunsById = useMemo(
        () => new Map(displayedAllRuns.map(run => [run.id, run])),
        [displayedAllRuns],
    );
    const displayedRunningRuns = useMemo(
        () => runningRuns.map(run => displayedRunsById.get(run.id) ?? run),
        [displayedRunsById, runningRuns],
    );
    const displayedRecentRuns = useMemo(
        () => recentRuns.map(run => displayedRunsById.get(run.id) ?? run),
        [displayedRunsById, recentRuns],
    );
    const navigationRuns = useMemo(
        () => Array.from(new Map(
            [...displayedRunningRuns, ...displayedRecentRuns].map(run => [run.id, run]),
        ).values()),
        [displayedRecentRuns, displayedRunningRuns],
    );
    const activeRunEntries = displayedAllRuns
        .filter(r => r.status === 'running' && r.flow?.id)
        .map(r => ({ id: r.id, flowId: r.flow!.id }));
    const waitingHumanIds = useWaitingHumanSet(activeRunEntries);

    useInertiaPolling({
        only: ['recentRuns', 'runningRuns', 'stats'],
        active: runningRuns.length > 0 || recentRuns.some(r => r.status === 'pending' || r.status === 'running'),
        activeDelay: 3000,
        idleDelay: 10000,
        pauseWhenHidden: true,
    });

    useSyncedRunDetail(displayedAllRuns, detailRun, setDetailRun);

    const handleKillRun = useCallback((run: FlowRun) => {
        if (!run.flow) return;
        markRunCancelled(run.id);
        router.post(`/flows/${run.flow.id}/runs/${run.id}/kill`, {}, {
            preserveState: true,
            onError: () => rollbackRunCancellation(run.id),
        });
    }, [markRunCancelled, rollbackRunCancellation]);

    const handleLibraryStoreOpen = useCallback(() => {
        openLibraryStoreQuery();
        setShowLibraryStore(true);
    }, []);

    return (
        <AppLayout
            title="Dashboard"
            headerRight={
                <S.HeaderActions>
                    <Button variant="secondary" size="sm" onClick={handleLibraryStoreOpen}>
                        <Icon icon="lucide:store" width={14} />
                        <S.BtnLabel>Blueprints</S.BtnLabel>
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>
                        <Icon icon="lucide:upload" width={14} />
                        <S.BtnLabel>Import</S.BtnLabel>
                    </Button>
                    <Button size="sm" onClick={() => router.visit('/flows/create')}>
                        <Icon icon="lucide:plus" width={14} />
                        <S.BtnLabel>New Flow</S.BtnLabel>
                    </Button>
                </S.HeaderActions>
            }
        >
            <DashboardStats stats={stats} />
            <RecentFlows flows={recentFlows} />
            <DashboardRuns
                runningRuns={displayedRunningRuns}
                recentRuns={displayedRecentRuns}
                waitingHumanIds={waitingHumanIds}
                onKill={handleKillRun}
                onOpen={setDetailRun}
            />
            <DashboardModals
                detailRun={detailRun}
                libraryStoreOpen={showLibraryStore}
                importModalOpen={showImportModal}
                onCloseDetail={() => setDetailRun(null)}
                onCloseLibraryStore={() => setShowLibraryStore(false)}
                onCloseImportModal={() => setShowImportModal(false)}
                onKill={handleKillRun}
                navigationRuns={navigationRuns}
                onNavigate={setDetailRun}
            />
        </AppLayout>
    );
}
