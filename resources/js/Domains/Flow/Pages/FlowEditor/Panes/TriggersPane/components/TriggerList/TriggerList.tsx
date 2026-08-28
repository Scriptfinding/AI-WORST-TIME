import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { SharedTriggerInfo } from './styled';
import type { FlowTrigger } from '@/Domains/Flow/types';
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
import TriggerListItem from './TriggerListItem/TriggerListItem';
import TriggerTreeNode from './TriggerTreeNode/TriggerTreeNode';

interface TriggerListProps {
    triggers: FlowTrigger[];
    otherTriggers: FlowTrigger[];
    selectedIds: Set<Id>;
    onToggleSelected: (triggerId: Id) => void;
    children?: ReactNode;
    onEdit: (trigger: FlowTrigger) => void;
    onToggleActive: (trigger: FlowTrigger) => void;
    onDelete: (trigger: FlowTrigger) => void;
    onDuplicate: (trigger: FlowTrigger) => void;
    onCopyEndpoint: (trigger: FlowTrigger) => void;
}

export default function TriggerList({
    triggers,
    otherTriggers,
    selectedIds,
    onToggleSelected,
    children,
    onEdit,
    onToggleActive,
    onDelete,
    onDuplicate,
    onCopyEndpoint,
}: TriggerListProps) {
    const [overflowId, setOverflowId] = useState<Id | null>(null);
    const overflowRef = useRef<HTMLDivElement>(null);
    const groupTree = useMemo(() => buildGroupTree(triggers), [triggers]);
    const toggleOverflow = (triggerId: Id) => {
        setOverflowId(current => current === triggerId ? null : triggerId);
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
                {triggers.length === 0 && (
                    <EmptyText>No triggers configured. Add a trigger to automate this flow.</EmptyText>
                )}
                {groupTree.ungrouped.map(trigger => (
                    <TriggerListItem
                        key={trigger.id}
                        trigger={trigger}
                        selected={selectedIds.has(trigger.id)}
                        onToggleSelected={onToggleSelected}
                        overflowOpen={overflowId === trigger.id}
                        overflowRef={overflowRef}
                        onEdit={onEdit}
                        onToggleActive={onToggleActive}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                        onCopyEndpoint={onCopyEndpoint}
                        onToggleOverflow={toggleOverflow}
                        onCloseOverflow={closeOverflow}
                    />
                ))}
                {groupTree.roots.map(node => (
                    <TriggerTreeNode
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
                        onCopyEndpoint={onCopyEndpoint}
                        onToggleOverflow={toggleOverflow}
                        onCloseOverflow={closeOverflow}
                    />
                ))}
            </List>
            {children}

            {otherTriggers.length > 0 && (
                <>
                    <SettingsSeparator style={{ margin: '14px 0' }} />
                    <SettingsSectionLabel>Shared Triggers</SettingsSectionLabel>
                    <SharedList>
                        {otherTriggers.map(trigger => {
                            const scopeLabel = getScopeLabel(trigger);
                            return (
                                <SharedTriggerInfo key={trigger.id}>
                                    <Icon icon={trigger.type === 'webhook' ? 'lucide:webhook' : 'lucide:clock'} width={12} />
                                    {trigger.user?.name} - {trigger.label}
                                    {scopeLabel && <SharedScope> - {scopeLabel}</SharedScope>}
                                </SharedTriggerInfo>
                            );
                        })}
                    </SharedList>
                </>
            )}
        </>
    );
}
