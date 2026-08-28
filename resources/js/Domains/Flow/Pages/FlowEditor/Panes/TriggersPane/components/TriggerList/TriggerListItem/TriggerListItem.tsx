import type { RefObject } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Switch from '@/Shared/UI/Switch/Switch';
import AvatarSelectionToggle from '@/Shared/UI/AvatarSelectionToggle/AvatarSelectionToggle';
import type { FlowTrigger } from '@/Domains/Flow/types';
import { SCOPE_ICONS } from '@/Domains/Flow/Pages/FlowEditor/Panes/resourceUtils';
import {
    ResourceItem as TriggerItem,
    ResourceItemActions as TriggerItemActions,
    ResourceItemHeader as TriggerItemHeader,
    ResourceItemIcon as TriggerItemIcon,
    ResourceItemInfo as TriggerItemInfo,
    ResourceItemMeta as TriggerItemMeta,
    ResourceItemName as TriggerItemName,
    ResourceOverflowButton as OverflowBtn,
    ResourceOverflowMenu as OverflowMenu,
    ResourceOverflowMenuItem as OverflowMenuItem,
    ResourceOverflowWrap as OverflowWrap,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/shared.styled';

interface TriggerListItemProps {
    trigger: FlowTrigger;
    overflowOpen: boolean;
    overflowRef: RefObject<HTMLDivElement | null>;
    selected: boolean;
    onToggleSelected: (triggerId: Id) => void;
    onEdit: (trigger: FlowTrigger) => void;
    onToggleActive: (trigger: FlowTrigger) => void;
    onDelete: (trigger: FlowTrigger) => void;
    onDuplicate: (trigger: FlowTrigger) => void;
    onCopyEndpoint: (trigger: FlowTrigger) => void;
    onToggleOverflow: (triggerId: Id) => void;
    onCloseOverflow: () => void;
}

export default function TriggerListItem({
    trigger,
    overflowOpen,
    overflowRef,
    selected,
    onToggleSelected,
    onEdit,
    onToggleActive,
    onDelete,
    onDuplicate,
    onCopyEndpoint,
    onToggleOverflow,
    onCloseOverflow,
}: TriggerListItemProps) {
    return (
        <TriggerItem>
            <TriggerItemHeader onClick={() => onEdit(trigger)}>
                <AvatarSelectionToggle
                    selected={selected}
                    onChange={() => onToggleSelected(trigger.id)}
                    label={`${selected ? 'Deselect' : 'Select'} ${trigger.label}`}
                    size={20}
                >
                    <TriggerItemIcon $active={trigger.is_active}>
                        <Icon icon={trigger.type === 'webhook' ? 'lucide:webhook' : 'lucide:clock'} />
                    </TriggerItemIcon>
                </AvatarSelectionToggle>
                <TriggerItemMeta>
                    <TriggerItemName>
                        {trigger.label}
                        {trigger.scope !== 'owner' && (
                            <Icon
                                icon={SCOPE_ICONS[trigger.scope] || 'lucide:building-2'}
                                width={12}
                                style={{ color: '#3b82f6' }}
                            />
                        )}
                    </TriggerItemName>
                    <TriggerItemInfo>
                        {trigger.type === 'webhook' ? 'Webhook' : 'Cron'}
                        {trigger.type === 'webhook' && trigger.endpoint_url && (
                            <>
                                {' - '}
                                <span
                                    onClick={event => {
                                        event.stopPropagation();
                                        onCopyEndpoint(trigger);
                                    }}
                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Copy URL
                                </span>
                            </>
                        )}
                        {trigger.type === 'cron' && trigger.config && (
                            <> - {(trigger.config as { cron_expression?: string }).cron_expression}</>
                        )}
                    </TriggerItemInfo>
                </TriggerItemMeta>
                <TriggerItemActions onClick={event => event.stopPropagation()}>
                    <Switch
                        id={`trigger-active-${trigger.id}`}
                        checked={trigger.is_active}
                        onChange={() => onToggleActive(trigger)}
                    />
                    <OverflowWrap ref={overflowOpen ? overflowRef : undefined}>
                        <OverflowBtn
                            type="button"
                            onClick={() => onToggleOverflow(trigger.id)}
                        >
                            <Icon icon="lucide:ellipsis-vertical" width={14} />
                        </OverflowBtn>
                        {overflowOpen && (
                            <OverflowMenu>
                                <OverflowMenuItem
                                    type="button"
                                    onClick={() => {
                                        onCloseOverflow();
                                        onDuplicate(trigger);
                                    }}
                                >
                                    <Icon icon="lucide:copy" width={13} /> Duplicate
                                </OverflowMenuItem>
                                <OverflowMenuItem
                                    type="button"
                                    $danger
                                    onClick={() => {
                                        onCloseOverflow();
                                        onDelete(trigger);
                                    }}
                                >
                                    <Icon icon="lucide:trash-2" width={13} /> Delete
                                </OverflowMenuItem>
                            </OverflowMenu>
                        )}
                    </OverflowWrap>
                </TriggerItemActions>
            </TriggerItemHeader>
        </TriggerItem>
    );
}
