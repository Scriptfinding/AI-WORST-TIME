import React, { useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import Modal from '@/Shared/UI/Modal/Modal';
import { useThemeMode } from '@/App/Hooks/useThemeMode';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { Flow, FlowRun } from '@/Domains/Flow/types';
import type { PageProps } from '@/App/types';
import RunFooter from './RunFooter/RunFooter';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import RunDetailContent from './RunDetailContent';
import RunDetailMeta from './RunDetailMeta/RunDetailMeta';
import RunDetailTitle from './RunDetailTitle/RunDetailTitle';
import { useRunTiming } from './hooks/useRunTiming';
import { useWaitingHuman } from './hooks/useWaitingHuman';

type FlowIconData = Pick<import('@/Domains/Flow/types').Flow, 'icon_type' | 'icon_value' | 'icon_color' | 'icon_url'> & { name?: string };

interface RunDetailModalProps {
    run: FlowRun | null;
    onClose: () => void;
    flowId: Id;
    flowName?: string;
    flowIcon?: FlowIconData;
    flow?: Flow;
    visualGraph?: NodalGraph | null;
    timeoutSeconds?: number | null;
    copyToClipboard: (text: string) => void;
    onKill?: (run: FlowRun) => void;
    onRerun?: (run: FlowRun) => void;
    navigationRuns?: FlowRun[];
    onNavigate?: (run: FlowRun) => void;
    footerExtra?: React.ReactNode;
}

export default function RunDetailModal({ run, onClose, flowId, flowName, flowIcon, flow, visualGraph, timeoutSeconds, copyToClipboard, onKill, onRerun, navigationRuns, onNavigate, footerExtra }: RunDetailModalProps) {
    const { isWaitingHuman, validationMessage, continuing, continueRun } = useWaitingHuman(run, flowId);
    const { elapsed, timeLeft } = useRunTiming(run, timeoutSeconds);
    const { resolved: resolvedTheme } = useThemeMode();
    const { confirm, ConfirmModal } = useConfirm();
    const { settings } = usePage<PageProps>().props;
    const liveViewEnabled = settings.live_view_enabled ?? false;
    const recordingEnabled = settings.recording_enabled ?? false;
    const isActive = run ? ['pending', 'running'].includes(run.status) : false;
    const isFinished = run ? !isActive : false;
    const currentIndex = run && navigationRuns
        ? navigationRuns.findIndex(candidate => candidate.id === run.id)
        : -1;
    const newerRun = currentIndex > 0 ? navigationRuns?.[currentIndex - 1] : undefined;
    const olderRun = currentIndex >= 0 ? navigationRuns?.[currentIndex + 1] : undefined;

    const handleDelete = useCallback(async () => {
        if (!run) return;
        const ok = await confirm({
            title: 'Delete this run?',
            message: 'This will permanently delete the run and all its artifacts.',
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (!ok) return;
        router.delete(`/flows/${flowId}/runs/${run.id}`, {
            preserveState: true,
            onSuccess: () => {
                onClose();
            },
        });
    }, [run, flowId, confirm, onClose]);

    return (
        <>
            <Modal
                isOpen={!!run}
                onClose={onClose}
                title={run
                    ? <RunDetailTitle run={run} flowName={flowName} flowIcon={flowIcon} />
                    : 'Run Details'}
                headerExtra={run ? <RunDetailMeta run={run} /> : undefined}
                fullScreen
                footer={run ? (
                    <RunFooter
                        run={run}
                        isActive={isActive}
                        isFinished={isFinished}
                        isWaitingHuman={isWaitingHuman}
                        timeLeft={timeLeft}
                        elapsed={elapsed}
                        onKill={onKill}
                        onRerun={onRerun}
                        onDelete={handleDelete}
                        onOlder={olderRun && onNavigate ? () => onNavigate(olderRun) : undefined}
                        onNewer={newerRun && onNavigate ? () => onNavigate(newerRun) : undefined}
                        footerExtra={footerExtra}
                    />
                ) : undefined}
            >
                {run && (
                    <RunDetailContent
                        run={run}
                        flowId={flowId}
                        flow={flow}
                        visualGraph={visualGraph}
                        resolvedTheme={resolvedTheme}
                        liveViewEnabled={liveViewEnabled}
                        recordingEnabled={recordingEnabled}
                        disabledFeatureMessage={settings.disabled_feature_message}
                        isWaitingHuman={isWaitingHuman}
                        validationMessage={validationMessage}
                        continuing={continuing}
                        onContinue={continueRun}
                        copyToClipboard={copyToClipboard}
                    />
                )}
            </Modal>
            <ConfirmModal />
        </>
    );
}
