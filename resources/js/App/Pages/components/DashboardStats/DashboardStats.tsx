import StatsGrid, { type StatItem } from '@/Shared/UI/StatsGrid/StatsGrid';
import CycleStatValue from './CycleStatValue';
import { formatSavedTime } from './utils';

interface CycleStats {
    used: number;
    limit: number | null;
    exceeded: boolean;
    starts_at: string;
    ends_at: string;
}

export interface DashboardStatsData {
    totalFlows: number;
    publishedFlows: number;
    totalRuns: number;
    failedRuns: number;
    pendingRuns: number;
    runningRuns: number;
    operatorSecondsSaved: number;
    cycle: CycleStats | null;
}

interface Props {
    stats: DashboardStatsData;
}

export default function DashboardStats({ stats }: Props) {
    const items: StatItem[] = [
        { label: 'Flows', value: stats.totalFlows, icon: 'lucide:workflow', color: '#6366f1' },
        { label: 'Published', value: stats.publishedFlows, icon: 'lucide:zap', color: '#10b981' },
        { label: 'Runs', value: stats.totalRuns, icon: 'lucide:play', color: '#3b82f6' },
        ...(stats.cycle?.limit != null ? [{
            label: 'Cycle Runs',
            value: <CycleStatValue used={stats.cycle.used} limit={stats.cycle.limit} />,
            icon: 'lucide:gauge',
            color: stats.cycle.exceeded ? '#ef4444' : '#22c55e',
            progress: (stats.cycle.used / stats.cycle.limit) * 100,
        } satisfies StatItem] : []),
        { label: 'Pending', value: stats.pendingRuns, icon: 'lucide:clock', color: '#f59e0b' },
        { label: 'Running', value: stats.runningRuns, icon: 'lucide:loader-2', color: '#3b82f6' },
        { label: 'Failed', value: stats.failedRuns, icon: 'lucide:x-circle', color: '#ef4444' },
        { label: 'Time Saved', value: formatSavedTime(stats.operatorSecondsSaved), icon: 'lucide:hand-coins', color: '#a855f7' },
    ];

    return <StatsGrid items={items} />;
}
