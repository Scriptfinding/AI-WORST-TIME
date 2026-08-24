import type { MouseEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { FlowRun } from '@/Domains/Flow/types';
import { formatDateTime } from '@/Shared/Utils/formatDate';
import { ucfirst } from '@/Shared/Utils/string';
import { getRunMeta } from '@/Domains/Flow/Pages/FlowEditor/utils/runDisplay';
import { STATUS_VARIANT } from '@/Domains/Flow/Pages/FlowEditor/types';
import * as RunStyles from '@/Domains/Flow/Pages/FlowEditor/shared/runStatus.styled';
import * as S from './RunHistoryItem.styled';
import { getRunHistoryStatusIcon } from './utils';

interface Props {
    run: FlowRun;
    selected: boolean;
    selectable: boolean;
    waitingHuman: boolean;
    onOpen: (run: FlowRun) => void;
    onToggleSelection: (runId: number, event: MouseEvent) => void;
    onKill: (run: FlowRun) => void;
    onOpenMetadata: (runId: number, trigger: HTMLElement) => void;
}

export default function RunHistoryItem({
    run,
    selected,
    selectable,
    waitingHuman,
    onOpen,
    onToggleSelection,
    onKill,
    onOpenMetadata,
}: Props) {
    return (
        <S.RunItem>
            <S.RunItemHeader onClick={() => onOpen(run)}>
                {selectable ? (
                    <S.StatusCheckboxWrapper
                        $checked={selected}
                        onClick={event => onToggleSelection(run.id, event)}
                        title={selected ? 'Deselect' : 'Select'}
                    >
                        <S.StatusIconInner
                            $variant={STATUS_VARIANT[run.status]}
                            $spinning={run.status === 'running'}
                            $hidden={selected}
                        >
                            <Icon icon={getRunHistoryStatusIcon(run.status)} />
                        </S.StatusIconInner>
                        <S.CheckboxOverlay $checked={selected}>
                            <Icon icon="lucide:check" />
                        </S.CheckboxOverlay>
                    </S.StatusCheckboxWrapper>
                ) : (
                    <S.StatusIconInner
                        $variant={STATUS_VARIANT[run.status]}
                        $spinning={run.status === 'running'}
                        title={run.status}
                    >
                        <Icon icon={getRunHistoryStatusIcon(run.status)} />
                    </S.StatusIconInner>
                )}
                {waitingHuman && (
                    <RunStyles.WaitingHumanIcon title="Waiting for human validation">
                        <Icon icon="lucide:hand" width={14} height={14} />
                    </RunStyles.WaitingHumanIcon>
                )}
                <S.RunItemMeta>
                    <S.RunItemDate>
                        <S.RunId>#{run.id}</S.RunId>
                        {formatDateTime(run.created_at)}
                    </S.RunItemDate>
                    {run.legend && <S.RunItemLegend>{run.legend}</S.RunItemLegend>}
                    <S.RunItemInfo>
                        {run.duration_ms != null && (
                            <S.RunItemDuration>
                                <Icon icon="lucide:timer" width={10} height={10} />
                                {(run.duration_ms / 1000).toFixed(1)}s
                            </S.RunItemDuration>
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
                                    onOpenMetadata(run.id, event.currentTarget);
                                }}
                            >
                                <Icon icon="lucide:tag" width={10} height={10} />
                                meta
                            </S.RunItemMetaIcon>
                        )}
                        <S.RunItemTrigger>
                            <Icon icon="lucide:user" width={10} height={10} />
                            {run.triggered_by_user
                                ? `${run.trigger_type === 'api' ? 'Api · ' : ''}by ${ucfirst(run.triggered_by_user.name)}`
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
    );
}
