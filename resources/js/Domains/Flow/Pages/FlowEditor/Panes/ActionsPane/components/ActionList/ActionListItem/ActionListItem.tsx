import type { RefObject } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Switch from '@/Shared/UI/Switch/Switch';
import AvatarSelectionToggle from '@/Shared/UI/AvatarSelectionToggle/AvatarSelectionToggle';
import type { FlowAction } from '@/Domains/Flow/types';
import { SCOPE_ICONS } from '@/Domains/Flow/Pages/FlowEditor/Panes/resourceUtils';
import {
    ResourceItem as ActionItem,
    ResourceItemActions as ActionItemActions,
    ResourceItemHeader as ActionItemHeader,
    ResourceItemIcon as ActionItemIcon,
    ResourceItemInfo as ActionItemInfo,
    ResourceItemMeta as ActionItemMeta,
    ResourceItemName as ActionItemName,
    ResourceOverflowButton as OverflowBtn,
    ResourceOverflowMenu as OverflowMenu,
    ResourceOverflowMenuItem as OverflowMenuItem,
    ResourceOverflowWrap as OverflowWrap,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/shared.styled';

interface ActionListItemProps {
    action: FlowAction;
    overflowOpen: boolean;
    overflowRef: RefObject<HTMLDivElement | null>;
    selected: boolean;
    onToggleSelected: (actionId: Id) => void;
    onEdit: (action: FlowAction) => void;
    onToggleActive: (action: FlowAction) => void;
    onDelete: (action: FlowAction) => void;
    onDuplicate: (action: FlowAction) => void;
    onToggleOverflow: (actionId: Id) => void;
    onCloseOverflow: () => void;
}

export default function ActionListItem({
    action,
    overflowOpen,
    overflowRef,
    selected,
    onToggleSelected,
    onEdit,
    onToggleActive,
    onDelete,
    onDuplicate,
    onToggleOverflow,
    onCloseOverflow,
}: ActionListItemProps) {
    return (
        <ActionItem>
            <ActionItemHeader onClick={() => onEdit(action)}>
                <AvatarSelectionToggle
                    selected={selected}
                    onChange={() => onToggleSelected(action.id)}
                    label={`${selected ? 'Deselect' : 'Select'} ${action.label}`}
                    size={20}
                >
                    <ActionItemIcon $active={action.is_active}>
                        <Icon icon="lucide:webhook" />
                    </ActionItemIcon>
                </AvatarSelectionToggle>
                <ActionItemMeta>
                    <ActionItemName>
                        {action.label}
                        {action.scope !== 'owner' && (
                            <Icon
                                icon={SCOPE_ICONS[action.scope] || 'lucide:building-2'}
                                width={12}
                                style={{ color: '#3b82f6' }}
                            />
                        )}
                    </ActionItemName>
                    <ActionItemInfo>
                        Webhook
                        {action.config?.url && <> - {action.config.url}</>}
                        {action.fire_on_error && ' - Fires on error'}
                    </ActionItemInfo>
                </ActionItemMeta>
                <ActionItemActions onClick={event => event.stopPropagation()}>
                    <Switch
                        id={`action-active-${action.id}`}
                        checked={action.is_active}
                        onChange={() => onToggleActive(action)}
                    />
                    <OverflowWrap ref={overflowOpen ? overflowRef : undefined}>
                        <OverflowBtn
                            type="button"
                            onClick={() => onToggleOverflow(action.id)}
                        >
                            <Icon icon="lucide:ellipsis-vertical" width={14} />
                        </OverflowBtn>
                        {overflowOpen && (
                            <OverflowMenu>
                                <OverflowMenuItem
                                    type="button"
                                    onClick={() => {
                                        onCloseOverflow();
                                        onDuplicate(action);
                                    }}
                                >
                                    <Icon icon="lucide:copy" width={13} /> Duplicate
                                </OverflowMenuItem>
                                <OverflowMenuItem
                                    type="button"
                                    $danger
                                    onClick={() => {
                                        onCloseOverflow();
                                        onDelete(action);
                                    }}
                                >
                                    <Icon icon="lucide:trash-2" width={13} /> Delete
                                </OverflowMenuItem>
                            </OverflowMenu>
                        )}
                    </OverflowWrap>
                </ActionItemActions>
            </ActionItemHeader>
        </ActionItem>
    );
}
