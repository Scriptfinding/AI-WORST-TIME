import type { FlowRun } from '@/Domains/Flow/types';

export function getRunStatusIcon(status: FlowRun['status']): string {
    if (status === 'success') return 'lucide:check';
    if (status === 'error') return 'lucide:x';
    if (status === 'cancelled') return 'lucide:ban';
    if (status === 'running') return 'lucide:loader-2';
    return 'lucide:clock';
}

export function formatRunDuration(ms: number | null | undefined): string {
    if (ms == null) return '-';
    if (ms < 1000) return `${ms}ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}
