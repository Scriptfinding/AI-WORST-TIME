import type { RefObject } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { FlowAction } from '@/Domains/Flow/types';
import type { GroupTreeNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/resourceUtils';
import { ResourceTreeGroupLabel as TreeGroupLabel } from '@/Domains/Flow/Pages/FlowEditor/Panes/shared.styled';
import ActionListItem from '../ActionListItem/ActionListItem';

interface ActionTreeNodeProps {
    node: GroupTreeNode<FlowAction>;
    depth?: number;
    overflowId: Id | null;
    overflowRef: RefObject<HTMLDivElement | null>;
    selectedIds: Set<Id>;
    onToggleSelected: (actionId: Id) => void;
    onEdit: (action: FlowAction) => void;
    onToggleActive: (action: FlowAction) => void;
    onDelete: (action: FlowAction) => void;
    onDuplicate: (action: FlowAction) => void;
    onToggleOverflow: (actionId: Id) => void;
    onCloseOverflow: () => void;
}

export default function ActionTreeNode({
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
    onToggleOverflow,
    onCloseOverflow,
}: ActionTreeNodeProps) {
    return (
        <>
            <TreeGroupLabel $depth={depth}>
                <Icon icon={depth === 0 ? 'lucide:folder' : 'lucide:corner-down-right'} width={12} />
                {node.label}
            </TreeGroupLabel>
            {node.items.map(action => (
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
                    onToggleOverflow={onToggleOverflow}
                    onCloseOverflow={onCloseOverflow}
                />
            ))}
            {node.children.map(child => (
                <ActionTreeNode
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
                    onToggleOverflow={onToggleOverflow}
                    onCloseOverflow={onCloseOverflow}
                />
            ))}
        </>
    );
}
