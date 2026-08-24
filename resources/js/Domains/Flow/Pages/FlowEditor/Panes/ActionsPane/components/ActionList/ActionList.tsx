import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { SharedActionInfo } from './styled';
import type { FlowAction } from '@/Domains/Flow/types';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
import { buildGroupTree, getScopeLabel } from '@/Domains/Flow/Pages/FlowEditor/Panes/resourceUtils';
import {
    ResourceEmptyText as EmptyText,
    ResourceList as List,
    ResourceSectionLabel as SettingsSectionLabel,
    ResourceSeparator as SettingsSeparator,
    SharedResourceList as SharedList,
    SharedResourceScope as SharedScope,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/shared.styled';
import ActionListItem from './ActionListItem/ActionListItem';
import ActionTreeNode from './ActionTreeNode/ActionTreeNode';

interface ActionListProps {
    actions: FlowAction[];
    otherActions: FlowAction[];
    selectedIds: Set<Id>;
    onToggleSelected: (actionId: Id) => void;
    children?: ReactNode;
    onEdit: (action: FlowAction) => void;
    onToggleActive: (action: FlowAction) => void;
    onDelete: (action: FlowAction) => void;
    onDuplicate: (action: FlowAction) => void;
}

export default function ActionList({
    actions,
    otherActions,
    selectedIds,
    onToggleSelected,
    children,
    onEdit,
    onToggleActive,
    onDelete,
    onDuplicate,
}: ActionListProps) {
    const [overflowId, setOverflowId] = useState<Id | null>(null);
    const overflowRef = useRef<HTMLDivElement>(null);
    const groupTree = useMemo(() => buildGroupTree(actions), [actions]);
    const toggleOverflow = (actionId: Id) => {
        setOverflowId(current => current === actionId ? null : actionId);
    };
    const closeOverflow = () => setOverflowId(null);

    useActionMenuDismiss({
        open: overflowId !== null,
        refs: [overflowRef],
        onDismiss: closeOverflow,
        closeOnScroll: false,
        eventType: 'mousedown',
        eventCapture: false,
    });

    return (
        <>
            <List>
                {actions.length === 0 && (
                    <EmptyText>No actions configured. Actions fire after a flow run completes.</EmptyText>
                )}
                {groupTree.ungrouped.map(action => (
                    <ActionListItem
                        key={action.id}
                        action={action}
                        selected={selectedIds.has(action.id)}
                        onToggleSelected={onToggleSelected}
                        overflowOpen={overflowId === action.id}
                        overflowRef={overflowRef}
                        onEdit={onEdit}
                        onToggleActive={onToggleActive}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                        onToggleOverflow={toggleOverflow}
                        onCloseOverflow={closeOverflow}
                    />
                ))}
                {groupTree.roots.map(node => (
                    <ActionTreeNode
                        key={node.fullPath}
                        node={node}
                        selectedIds={selectedIds}
                        onToggleSelected={onToggleSelected}
                        overflowId={overflowId}
                        overflowRef={overflowRef}
                        onEdit={onEdit}
                        onToggleActive={onToggleActive}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                        onToggleOverflow={toggleOverflow}
                        onCloseOverflow={closeOverflow}
                    />
                ))}
            </List>
            {children}

            {otherActions.length > 0 && (
                <>
                    <SettingsSeparator style={{ margin: '14px 0' }} />
                    <SettingsSectionLabel>Shared Actions</SettingsSectionLabel>
                    <SharedList>
                        {otherActions.map(action => {
                            const scopeLabel = getScopeLabel(action);
                            return (
                                <SharedActionInfo key={action.id}>
                                    <Icon icon="lucide:webhook" width={12} />
                                    {action.user?.name} - {action.label}
                                    {scopeLabel && <SharedScope> · {scopeLabel}</SharedScope>}
                                </SharedActionInfo>
                            );
                        })}
                    </SharedList>
                </>
            )}
        </>
    );
}
