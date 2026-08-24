import { Icon } from '@/Shared/UI/Icon/Icon';
import AvatarSelectionToggle from '@/Shared/UI/AvatarSelectionToggle/AvatarSelectionToggle';
import TableCellContent from '@/Shared/UI/TableCellContent/TableCellContent';
import type { NotificationChannel } from '@/Domains/NotificationChannel/types';
import * as S from './styled';

interface ChannelRowProps {
    channel: NotificationChannel;
    canManage: boolean;
    selected: boolean;
    onToggleSelected: (channelId: Id) => void;
    indent: number;
    providerIcons: Record<string, string>;
    workspaceColor?: string;
    onDelete: (channel: NotificationChannel) => void;
    onEdit: (channel: NotificationChannel) => void;
    onInspect: (channel: NotificationChannel) => void;
    onTest: (channel: NotificationChannel) => void;
    onToggle: (channel: NotificationChannel) => void;
}

export default function ChannelRow({
    channel,
    canManage,
    selected,
    onToggleSelected,
    indent,
    providerIcons,
    workspaceColor,
    onDelete,
    onEdit,
    onInspect,
    onTest,
    onToggle,
}: ChannelRowProps) {
    return (
        <tr>
            <S.Cell $indent={indent}>
                <TableCellContent>
                    <S.ChannelIdentity>
                        {canManage && (
                            <AvatarSelectionToggle
                                selected={selected}
                                onChange={() => onToggleSelected(channel.id)}
                                label={`${selected ? 'Deselect' : 'Select'} ${channel.name}`}
                                size={24}
                            >
                                <S.ChannelIcon>
                                    <Icon icon={providerIcons[channel.provider] || 'lucide:bell'} width={13} />
                                </S.ChannelIcon>
                            </AvatarSelectionToggle>
                        )}
                        <S.ChannelName>{channel.name}</S.ChannelName>
                    </S.ChannelIdentity>
                </TableCellContent>
            </S.Cell>
            <S.Cell>
                <TableCellContent>
                    <S.ProviderBadge $provider={channel.provider}>
                        <Icon icon={providerIcons[channel.provider] || 'lucide:bell'} width={14} />
                        {channel.provider}
                    </S.ProviderBadge>
                </TableCellContent>
            </S.Cell>
            <S.Cell>
                <TableCellContent>
                    {channel.messenger_integration ? (
                        <S.ConnectionName>
                            <Icon icon="lucide:plug" width={12} />
                            {channel.messenger_integration.name}
                        </S.ConnectionName>
                    ) : (
                        <S.ConnectionMissing>-</S.ConnectionMissing>
                    )}
                </TableCellContent>
            </S.Cell>
            <S.Cell>
                <TableCellContent>
                    {channel.config?.chat_name || channel.config?.chat_id ? (
                        <S.Destination>
                            <Icon icon="lucide:message-circle" width={13} height={13} />
                            {channel.config.chat_name || <S.DestinationId>{channel.config.chat_id}</S.DestinationId>}
                        </S.Destination>
                    ) : '-'}
                </TableCellContent>
            </S.Cell>
            <S.Cell $center>
                <TableCellContent $align="center">
                    <S.StatusBadge $active={channel.is_active}>
                        {channel.is_active ? 'Active' : 'Inactive'}
                    </S.StatusBadge>
                </TableCellContent>
            </S.Cell>
            <S.Cell>
                <TableCellContent>
                    <S.ScopeBadge $scope={channel.scope} $color={workspaceColor}>
                        <Icon icon={channel.scope === 'workspace' ? 'lucide:building-2' : channel.scope === 'team' ? 'lucide:users-round' : 'lucide:user'} width={10} />
                        {channel.scope === 'workspace' ? 'Workspace' : channel.scope === 'team' ? `Team: ${channel.team?.name || '-'}` : 'Personal'}
                    </S.ScopeBadge>
                </TableCellContent>
            </S.Cell>
            <S.Cell>
                <TableCellContent><S.OwnerName>{channel.user?.name || '-'}</S.OwnerName></TableCellContent>
            </S.Cell>
            <S.Cell>
                <TableCellContent>
                    {canManage && (
                        <S.Actions>
                            <S.ActionButton onClick={() => onInspect(channel)} title="Inspect usages">
                                <Icon icon="lucide:scan-search" width={14} />
                            </S.ActionButton>
                            <S.ActionButton onClick={() => onTest(channel)} title="Send test message">
                                <Icon icon="lucide:send" width={14} />
                            </S.ActionButton>
                            <S.ActionButton onClick={() => onToggle(channel)} title={channel.is_active ? 'Disable' : 'Enable'}>
                                <Icon icon={channel.is_active ? 'lucide:pause' : 'lucide:play'} width={14} />
                            </S.ActionButton>
                            <S.ActionButton onClick={() => onEdit(channel)} title="Edit">
                                <Icon icon="lucide:pencil" width={14} />
                            </S.ActionButton>
                            <S.DangerActionButton onClick={() => onDelete(channel)} title="Delete">
                                <Icon icon="lucide:trash-2" width={14} />
                            </S.DangerActionButton>
                        </S.Actions>
                    )}
                </TableCellContent>
            </S.Cell>
        </tr>
    );
}
