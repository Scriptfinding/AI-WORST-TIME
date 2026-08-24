import { useMemo, useRef, useState, type RefObject } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { ActionLogEntry } from '@/Domains/Flow/types';
import type { AiControlSequence } from '@/Domains/Flow/Utils/aiControlGraph';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
import {
    getEntryByAction,
    getNodeCategoryColor,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/catalog';
import ActionRow from './ActionRow.pp';
import * as S from './ActionGroup.styled.pp';

interface Props {
    actions: ActionLogEntry[];
    resourceLabels: ReadonlyMap<string, string>;
    activeIndex: number;
    activeRowRef: RefObject<HTMLDivElement | null>;
    selectAction: (index: number, timeMs: number) => void;
    startIndex: number;
    sequenceId?: string;
    onCreateFlow: (sequence: AiControlSequence) => void;
    onDownloadFlow: (sequence: AiControlSequence) => void;
}

export default function ActionGroup({
    actions,
    resourceLabels,
    activeIndex,
    activeRowRef,
    selectAction,
    startIndex,
    sequenceId,
    onCreateFlow,
    onDownloadFlow,
}: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const sequence = useMemo<AiControlSequence | null>(() => {
        if (!sequenceId) return null;
        const parent = actions.find(action => action.sequence_role === 'parent' || action.action === 'aiControl');
        if (!parent) return null;
        return {
            id: sequenceId,
            parent,
            actions: actions.filter(action => action.sequence_role === 'generated'),
        };
    }, [actions, sequenceId]);
    useActionMenuDismiss({
        open: menuOpen,
        refs: [menuRef, buttonRef],
        onDismiss: () => setMenuOpen(false),
        closeOnScroll: false,
    });
    const rows = actions.map((action, offset) => (
        <ActionRow
            key={startIndex + offset}
            action={action}
            resourceLabels={resourceLabels}
            activeIndex={activeIndex}
            activeRowRef={activeRowRef}
            index={startIndex + offset}
            selectAction={selectAction}
        />
    ));

    if (!sequence) {
        return actions.length > 1 ? <S.ActionGroup>{rows}</S.ActionGroup> : rows[0];
    }

    const sequenceColor = getNodeCategoryColor(getEntryByAction(sequence.parent.action));

    const run = (action: (value: AiControlSequence) => void) => {
        setMenuOpen(false);
        action(sequence);
    };

    return (
        <S.ActionGroup $aiSequence $color={sequenceColor}>
            <S.SequenceHeader $color={sequenceColor}>
                <S.SequenceTitle title="AI magic">
                    <Icon icon="lucide:sparkles" width={15} height={15} />
                    <span>AI Generated</span>
                </S.SequenceTitle>
                <S.SequenceMenuWrapper>
                    <S.SequenceMenuButton
                        ref={buttonRef}
                        type="button"
                        title="AI Control sequence actions"
                        onClick={() => setMenuOpen(value => !value)}
                    >
                        <Icon icon="lucide:ellipsis" width={14} height={14} />
                    </S.SequenceMenuButton>
                    {menuOpen && (
                        <S.SequenceMenu ref={menuRef}>
                            <S.SequenceMenuItem type="button" onClick={() => run(onDownloadFlow)}>
                                <Icon icon="lucide:download" width={13} height={13} />
                                Download flow JSON
                            </S.SequenceMenuItem>
                            <S.SequenceMenuItem type="button" onClick={() => run(onCreateFlow)}>
                                <Icon icon="lucide:workflow" width={13} height={13} />
                                Create flow from sequence
                            </S.SequenceMenuItem>
                        </S.SequenceMenu>
                    )}
                </S.SequenceMenuWrapper>
            </S.SequenceHeader>
            {rows}
        </S.ActionGroup>
    );
}
