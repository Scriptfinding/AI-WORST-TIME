import type { FlowRun } from '@/Domains/Flow/types';

export function getRunHistoryStatusIcon(status: FlowRun['status']): string {
    if (status === 'success') return 'lucide:check';
    if (status === 'error') return 'lucide:x';
    if (status === 'cancelled') return 'lucide:ban';
    if (status === 'running') return 'lucide:loader';
    return 'lucide:clock';
}
