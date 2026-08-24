import type { RefObject } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { FlowTrigger } from '@/Domains/Flow/types';
import type { GroupTreeNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/resourceUtils';
import { ResourceTreeGroupLabel as TreeGroupLabel } from '@/Domains/Flow/Pages/FlowEditor/Panes/shared.styled';
import TriggerListItem from '../TriggerListItem/TriggerListItem';

interface TriggerTreeNodeProps {
    node: GroupTreeNode<FlowTrigger>;
    depth?: number;
    overflowId: Id | null;
    overflowRef: RefObject<HTMLDivElement | null>;
    selectedIds: Set<Id>;
    onToggleSelected: (triggerId: Id) => void;
    onEdit: (trigger: FlowTrigger) => void;
    onToggleActive: (trigger: FlowTrigger) => void;
    onDelete: (trigger: FlowTrigger) => void;
    onDuplicate: (trigger: FlowTrigger) => void;
    onCopyEndpoint: (trigger: FlowTrigger) => void;
    onToggleOverflow: (triggerId: Id) => void;
    onCloseOverflow: () => void;
}

export default function TriggerTreeNode({
    node,
    depth = 0,
    overflowId,
    overflowRef,
    selectedIds,
    onToggleSelected,
    onEdit,
    onToggleActive,
    onDelete,
    onDuplicate,
    onCopyEndpoint,
    onToggleOverflow,
    onCloseOverflow,
}: TriggerTreeNodeProps) {
    return (
        <>
            <TreeGroupLabel $depth={depth}>
                <Icon icon={depth === 0 ? 'lucide:folder' : 'lucide:corner-down-right'} width={12} />
                {node.label}
            </TreeGroupLabel>
            {node.items.map(trigger => (
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
                    onToggleOverflow={onToggleOverflow}
                    onCloseOverflow={onCloseOverflow}
                />
            ))}
            {node.children.map(child => (
                <TriggerTreeNode
                    key={child.fullPath}
                    node={child}
                    depth={depth + 1}
                    overflowId={overflowId}
                    overflowRef={overflowRef}
                    selectedIds={selectedIds}
                    onToggleSelected={onToggleSelected}
                    onEdit={onEdit}
                    onToggleActive={onToggleActive}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    onCopyEndpoint={onCopyEndpoint}
                    onToggleOverflow={onToggleOverflow}
                    onCloseOverflow={onCloseOverflow}
                />
            ))}
        </>
    );
}
