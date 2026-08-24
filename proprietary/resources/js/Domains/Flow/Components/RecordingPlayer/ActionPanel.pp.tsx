import { Icon } from '@/Shared/UI/Icon/Icon';
import { useMemo } from 'react';
import type { MouseEventHandler, RefObject } from 'react';
import { ResizeHandle, Panel, ActionPanelHeader, PanelCloseButton, ActionCount, ActionList } from './ActionPanel.styled.pp';
import type { ActionLogEntry } from '@/Domains/Flow/types';
import type { AiControlSequence } from '@/Domains/Flow/Utils/aiControlGraph';
import ActionGroup from './ActionGroup.pp';
import { groupActions } from './helpers.pp';

interface Props {
    actions: ActionLogEntry[];
    resourceLabels: ReadonlyMap<string, string>;
    activeIndex: number;
    activeRowRef: RefObject<HTMLDivElement | null>;
    onClose: () => void;
    onResizeStart: MouseEventHandler;
    panelRef: RefObject<HTMLDivElement | null>;
    panelWidth: number;
    selectAction: (index: number, timeMs: number) => void;
    onCreateFlow: (sequence: AiControlSequence) => void;
    onDownloadFlow: (sequence: AiControlSequence) => void;
}

export default function ActionPanel({
    actions,
    resourceLabels,
    activeIndex,
    activeRowRef,
    onClose,
    onResizeStart,
    panelRef,
    panelWidth,
    selectAction,
    onCreateFlow,
    onDownloadFlow,
}: Props) {
    const actionGroups = useMemo(() => groupActions(actions), [actions]);

    return (
        <>
            <ResizeHandle onMouseDown={onResizeStart} />
            <Panel ref={panelRef} style={{ width: panelWidth }}>
                <ActionPanelHeader>
                    <Icon icon="lucide:list" width={12} height={12} />
                    Actions
                    <ActionCount>{actions.length}</ActionCount>
                    <PanelCloseButton onClick={onClose} title="Hide actions">
                        <Icon icon="lucide:x" width={12} height={12} />
                    </PanelCloseButton>
                </ActionPanelHeader>
                <ActionList>
                    {actionGroups.map((group) => (
                        <ActionGroup
                            key={group.start}
                            actions={group.items}
                            resourceLabels={resourceLabels}
                            activeIndex={activeIndex}
                            activeRowRef={activeRowRef}
                            selectAction={selectAction}
                            startIndex={group.start}
                            sequenceId={group.sequenceId}
                            onCreateFlow={onCreateFlow}
                            onDownloadFlow={onDownloadFlow}
                        />
                    ))}
                </ActionList>
            </Panel>
        </>
    );
}
