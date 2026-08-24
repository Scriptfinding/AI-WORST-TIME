import React, { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Badge from '@/Shared/UI/Badge/Badge';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
import { STATUS_VARIANT } from '@/Domains/Flow/Pages/FlowEditor/types';
import { getRunMeta, renderInlineMarkdown } from '@/Domains/Flow/Pages/FlowEditor/utils/runDisplay';
import { formatDateTime } from '@/Shared/Utils/formatDate';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import { ucfirst } from '@/Shared/Utils/string';
import type { FlowRun } from '@/Domains/Flow/types';
import * as S from './styled';
import { formatRunDuration, getRunStatusIcon } from './utils';

interface RunListItemProps {
    run: FlowRun;
    waitingHuman?: boolean;
    selected?: boolean;
    selectionActive?: boolean;
    selectable?: boolean;
    showDuration?: boolean;
    showArtifacts?: boolean;
    showMeta?: boolean;
    showGoToFlow?: boolean;
    showStop?: boolean;
    onOpen: (run: FlowRun) => void;
    onToggleSelect?: (run: FlowRun) => void;
    onKill?: (run: FlowRun) => void;
}

export default function RunListItem({
    run,
    waitingHuman = false,
    selected = false,
    selectionActive = false,
    selectable = false,
    showDuration = true,
    showArtifacts = true,
    showMeta = true,
    showGoToFlow = true,
    showStop = true,
    onOpen,
    onToggleSelect,
    onKill,
}: RunListItemProps) {
    const [metaOpen, setMetaOpen] = useState(false);
    const metaPopoverRef = useRef<HTMLDivElement>(null);
    const meta = getRunMeta(run);

    useActionMenuDismiss({
        open: metaOpen,
        refs: [metaPopoverRef],
        onDismiss: () => setMetaOpen(false),
        closeOnScroll: false,
        eventType: 'mousedown',
        eventCapture: false,
    });

    const handleItemClick = () => {
        if (selectionActive && selectable && onToggleSelect) {
            onToggleSelect(run);
            return;
        }

        onOpen(run);
    };

    return (
        <S.RunItem
            $selected={selected}
            $selectionActive={selectionActive}
            $selectable={selectable}
            onClick={handleItemClick}
        >
            <S.RunMain>
                <S.RunId>#{run.id}</S.RunId>
                <S.SelectableStatusWrapper>
                    <S.SelectableStatusIcon $selected={selected}>
                        <Badge variant={STATUS_VARIANT[run.status]}>
                            <Icon
                                icon={getRunStatusIcon(run.status)}
                                width={12}
                                height={12}
                                role="img"
                                aria-label={ucfirst(run.status)}
                                style={run.status === 'running' ? { animation: 'spin 1s linear infinite' } : undefined}
                            />
                        </Badge>
                    </S.SelectableStatusIcon>
                    {selectable && (
                        <S.SelectCheckbox
                            type="button"
                            $selected={selected}
                            aria-pressed={selected}
                            aria-label={selected ? `Unselect run ${run.id}` : `Select run ${run.id}`}
                            onClick={event => {
                                event.preventDefault();
                                event.stopPropagation();
                                onToggleSelect?.(run);
                            }}
                        >
                            {selected && <Icon icon="lucide:check" width={13} height={13} />}
                        </S.SelectCheckbox>
                    )}
                </S.SelectableStatusWrapper>
                {waitingHuman && (
                    <S.WaitingHumanIcon title="Waiting for human validation">
                        <Icon icon="lucide:hand" width={12} height={12} />
                    </S.WaitingHumanIcon>
                )}
                <S.RunFlow>
                    {run.flow && <FlowIcon flow={run.flow} size={18} />}
                    <S.RunFlowName>{run.flow?.name || 'Unknown'}</S.RunFlowName>
                    {run.legend && (
                        <>
                            <S.RunLegendSeparator aria-hidden>|</S.RunLegendSeparator>
                            <S.RunLegend>{run.legend}</S.RunLegend>
                        </>
                    )}
                </S.RunFlow>
            </S.RunMain>
            <S.RunMeta>
                {showDuration && (
                    <S.RunMetaItem>
                        <Icon icon="lucide:timer" width={10} height={10} />
                        {formatRunDuration(run.duration_ms)}
                    </S.RunMetaItem>
                )}
                {showArtifacts && (
                    <S.ArtifactGroup>
                        {run.screenshots_count > 0 && (
                            <S.RunMetaItem title="Screenshots">
                                <Icon icon="lucide:camera" width={10} height={10} />
                                {run.screenshots_count}
                            </S.RunMetaItem>
                        )}
                        {run.downloads_count > 0 && (
                            <S.RunMetaItem title="Downloads">
                                <Icon icon="lucide:download" width={10} height={10} />
                                {run.downloads_count}
                            </S.RunMetaItem>
                        )}
                        {run.has_recording && (
                            <S.RunMetaItem title="Recording available">
                                <Icon icon="lucide:video" width={10} height={10} />
                                Rec
                            </S.RunMetaItem>
                        )}
                    </S.ArtifactGroup>
                )}
                {showMeta && meta && (
                    <S.MetaPopoverAnchor>
                        <S.MetaButton
                            type="button"
                            title="View metadata"
                            onClick={event => {
                                event.stopPropagation();
                                setMetaOpen(prev => !prev);
                            }}
                        >
                            <Icon icon="lucide:tag" width={10} height={10} />
                            meta
                        </S.MetaButton>
                        {metaOpen && (
                            <S.MetaPopover ref={metaPopoverRef} onClick={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()}>
                                <S.MetaPopoverTitle>
                                    <Icon icon="lucide:tag" width={12} height={12} />
                                    Metadata
                                </S.MetaPopoverTitle>
                                <S.MetaPopoverBody>
                                    {Object.entries(meta).map(([key, value]) => (
                                        <S.MetaPopoverRow key={key}>
                                            <S.MetaPopoverKey>{key}</S.MetaPopoverKey>
                                            <S.MetaPopoverValue>{typeof value === 'object' ? JSON.stringify(value) : renderInlineMarkdown(String(value))}</S.MetaPopoverValue>
                                        </S.MetaPopoverRow>
                                    ))}
                                </S.MetaPopoverBody>
                            </S.MetaPopover>
                        )}
                    </S.MetaPopoverAnchor>
                )}
                <S.RunMetaItem>
                    <Icon icon="lucide:user" width={10} height={10} />
                    {run.triggered_by_user
                        ? `${run.trigger_type === 'api' ? 'Api · ' : ''}by ${ucfirst(run.triggered_by_user.name)}`
                        : ucfirst(run.trigger_type)}
                </S.RunMetaItem>
                <S.RunMetaItem>
                    <Icon icon="lucide:calendar" width={10} height={10} />
                    {formatDateTime(run.created_at)}
                </S.RunMetaItem>
                {showGoToFlow && run.flow && (
                    <S.RunActionButton
                        href={`/flows/${run.flow.id}`}
                        title="Go to flow"
                        onClick={event => {
                            event.stopPropagation();
                            handleLinkClick(event, `/flows/${run.flow?.id}`);
                        }}
                    >
                        <Icon icon="lucide:inspect" width={14} height={14} />
                    </S.RunActionButton>
                )}
                {showStop && (run.status === 'running' || run.status === 'pending') && onKill && (
                    <S.StopButton
                        type="button"
                        title="Stop run"
                        onClick={event => {
                            event.stopPropagation();
                            onKill(run);
                        }}
                    >
                        <Icon icon="lucide:ban" width={14} height={14} />
                    </S.StopButton>
                )}
            </S.RunMeta>
        </S.RunItem>
    );
}
