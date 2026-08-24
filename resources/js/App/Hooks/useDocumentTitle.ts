import { useEffect } from 'react';
import type { FlowRun } from '@/Domains/Flow/types';
import { formatDocumentTitle } from '@/App/Utils/documentTitle';

const STATUS_EMOJI: Record<string, string> = {
    running: '▶',
    pending: '⏳',
    success: '✅',
    error: '❌',
    cancelled: '⛔',
};

const SPINNER_FRAMES = ['◐', '◓', '◑', '◒'];

// Reflects the latest flow-run state in the browser title, including active progress.
export function useDocumentTitle(base: string, runs: FlowRun[], waitingHumanIds?: Set<number>) {
    useEffect(() => {
        const baseTitle = formatDocumentTitle(base);
        const activeRun = runs.find(r => r.status === 'running');
        const pendingRun = !activeRun && runs.find(r => r.status === 'pending');
        const latestRun = runs[0];

        if (activeRun && waitingHumanIds?.has(activeRun.id)) {
            document.title = `✋ Waiting · ${baseTitle}`;
            return;
        }

        if (activeRun) {
            let frame = 0;
            const tick = () => {
                document.title = `${SPINNER_FRAMES[frame]} Running · ${baseTitle}`;
                frame = (frame + 1) % SPINNER_FRAMES.length;
            };
            tick();
            const id = setInterval(tick, 400);
            return () => { clearInterval(id); };
        }

        if (pendingRun) {
            document.title = `${STATUS_EMOJI.pending} Pending · ${baseTitle}`;
            return;
        }

        if (latestRun) {
            const emoji = STATUS_EMOJI[latestRun.status] || '';
            document.title = `${emoji} ${baseTitle}`;
            return;
        }

        document.title = baseTitle;
    }, [base, runs, waitingHumanIds]);
}
