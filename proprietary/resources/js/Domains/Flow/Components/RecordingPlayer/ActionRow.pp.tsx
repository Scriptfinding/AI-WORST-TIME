import { Icon } from '@/Shared/UI/Icon/Icon';
import type { RefObject } from 'react';
import type { ActionLogEntry } from '@/Domains/Flow/types';
import {
    getEntryByAction,
    getNodeCategoryColor,
    getNodeIcon,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/catalog';
import { formatTime, resolveActionLabel } from './helpers.pp';
import * as S from './ActionRow.styled.pp';

interface Props {
    action: ActionLogEntry;
    resourceLabels: ReadonlyMap<string, string>;
    activeIndex: number;
    activeRowRef: RefObject<HTMLDivElement | null>;
    index: number;
    selectAction: (index: number, timeMs: number) => void;
}

export default function ActionRow({
    action,
    resourceLabels,
    activeIndex,
    activeRowRef,
    index,
    selectAction,
}: Props) {
    const entry = getEntryByAction(action.action);
    const color = getNodeCategoryColor(entry);
    const iconName = getNodeIcon(entry);
    const isActive = index === activeIndex;
    const displayLabel = resolveActionLabel(action.label, resourceLabels);

    return (
        <S.ActionRow
            ref={isActive ? activeRowRef : undefined}
            $active={isActive}
            $past={index < activeIndex}
            $color={color}
            onClick={() => selectAction(index, action.offset_ms)}
        >
            <S.ActionRowIcon $color={color}>
                <Icon icon={iconName} width={11} height={11} />
            </S.ActionRowIcon>
            <S.ActionRowBody>
                <S.ActionRowName>{action.action}</S.ActionRowName>
                {displayLabel && <S.ActionRowLabel>{displayLabel}</S.ActionRowLabel>}
            </S.ActionRowBody>
            <S.ActionRowTime>{formatTime(action.offset_ms / 1000)}</S.ActionRowTime>
        </S.ActionRow>
    );
}
