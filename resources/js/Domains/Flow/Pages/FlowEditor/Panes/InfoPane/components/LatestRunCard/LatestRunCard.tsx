import { useCallback, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useWaitingHumanSet } from '@/Domains/Flow/Hooks/useWaitingHuman';
import type { FlowRun } from '@/Domains/Flow/types';
import { formatDateTime } from '@/Shared/Utils/formatDate';
import { ucfirst } from '@/Shared/Utils/string';
import { STATUS_VARIANT } from '@/Domains/Flow/Pages/FlowEditor/types';
import { getRunMeta } from '@/Domains/Flow/Pages/FlowEditor/utils/runDisplay';
import MetadataPopover from '@/Domains/Flow/Pages/FlowEditor/Panes/InfoPane/components/MetadataPopover/MetadataPopover';
import * as S from './styled';

interface LatestRunCardProps {
    flowId: Id;
    run: FlowRun;
    onViewDetails: (run: FlowRun) => void;
    onKill: (run: FlowRun) => void;
}

export default function LatestRunCard({ flowId, run, onViewDetails, onKill }: LatestRunCardProps) {
    const waitingHumanIds = useWaitingHumanSet(
        run.status === 'running' ? [{ id: run.id, flowId }] : [],
    );
    const [metadataTriggerRect, setMetadataTriggerRect] = useState<DOMRect | null>(null);

    const closeMetadata = useCallback(() => setMetadataTriggerRect(null), []);

    const toggleMetadata = (trigger: HTMLElement) => {
        setMetadataTriggerRect(current => current ? null : trigger.getBoundingClientRect());
    };

    return (
        <S.LatestRunDetails>
            <S.LatestRunTitle>Latest Run</S.LatestRunTitle>
            <S.RunItem>
                <S.RunItemHeader onClick={() => onViewDetails(run)}>
                    <S.RunStatusIcon
                        $variant={STATUS_VARIANT[run.status]}
                        $spinning={run.status === 'running'}
                        title={run.status}
                    >
                        <Icon icon={
                            run.status === 'success' ? 'lucide:check' :
                            run.status === 'error' ? 'lucide:x' :
                            run.status === 'cancelled' ? 'lucide:ban' :
                            run.status === 'running' ? 'lucide:loader' :
                            'lucide:clock'
                        } />
                    </S.RunStatusIcon>
                    {waitingHumanIds.has(run.id) && (
                        <S.WaitingHumanIcon title="Waiting for human validation">
                            <Icon icon="lucide:hand" width={14} height={14} />
                        </S.WaitingHumanIcon>
                    )}
                    <S.RunItemMeta>
                        <S.RunItemDate>
                            <S.RunId>#{run.id}</S.RunId>
                            {formatDateTime(run.created_at)}
                        </S.RunItemDate>
                        {run.legend && <S.RunItemLegend>{run.legend}</S.RunItemLegend>}
                        <S.RunItemInfo>
                            {run.duration_ms != null && (
                                <S.RunItemArtifact>
                                    <Icon icon="lucide:timer" width={10} height={10} />
                                    {(run.duration_ms / 1000).toFixed(1)}s
                                </S.RunItemArtifact>
                            )}
                            {run.screenshots_count > 0 && (
                                <S.RunItemArtifact title="Screenshots">
                                    <Icon icon="lucide:camera" width={10} height={10} />
                                    {run.screenshots_count}
                                </S.RunItemArtifact>
                            )}
                            {run.downloads_count > 0 && (
                                <S.RunItemArtifact title="Downloads">
                                    <Icon icon="lucide:download" width={10} height={10} />
                                    {run.downloads_count}
                                </S.RunItemArtifact>
                            )}
                            {run.has_recording && (
                                <S.RunItemArtifact title="Recording available">
                                    <Icon icon="lucide:video" width={10} height={10} />
                                    Rec
                                </S.RunItemArtifact>
                            )}
                            {getRunMeta(run) && (
                                <S.RunItemMetaIcon
                                    title="View metadata"
                                    onClick={event => {
                                        event.stopPropagation();
                                        toggleMetadata(event.currentTarget);
                                    }}
                                >
                                    <Icon icon="lucide:tag" width={10} height={10} />
                                    meta
                                </S.RunItemMetaIcon>
                            )}
                            <S.RunItemTrigger>
                                <Icon icon="lucide:user" width={10} height={10} />
                                {run.triggered_by_user
                                    ? `${run.trigger_type === 'api' ? 'API run ' : ''}by ${ucfirst(run.triggered_by_user.name)}`
                                    : ucfirst(run.trigger_type)}
                            </S.RunItemTrigger>
                        </S.RunItemInfo>
                    </S.RunItemMeta>
                    {(run.status === 'running' || run.status === 'pending') && (
                        <S.RunStopButton
                            onClick={event => {
                                event.stopPropagation();
                                onKill(run);
                            }}
                            title="Stop run"
                            aria-label="Stop run"
                        >
                            <Icon icon="lucide:ban" width={13} height={13} />
                        </S.RunStopButton>
                    )}
                    <S.RunDetailToggle title="View run details" aria-label="View run details">
                        <Icon icon="lucide:arrow-up-right" width={13} height={13} />
                    </S.RunDetailToggle>
                </S.RunItemHeader>
            </S.RunItem>
            <MetadataPopover run={run} triggerRect={metadataTriggerRect} onClose={closeMetadata} />
        </S.LatestRunDetails>
    );
}
