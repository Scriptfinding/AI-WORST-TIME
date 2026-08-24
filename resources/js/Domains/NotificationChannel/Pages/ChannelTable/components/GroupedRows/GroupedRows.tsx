import React, { useMemo } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { NotificationChannel } from '@/Domains/NotificationChannel/types';
import { groupHierarchicalItems } from '@/Shared/Utils/groupHierarchicalItems';
import ChannelRow from '@/Domains/NotificationChannel/Pages/ChannelTable/components/ChannelRow/ChannelRow';
import * as S from './styled';

interface GroupedRowsProps {
    channels: NotificationChannel[];
    collapsedGroups: Set<string>;
    isAdmin: boolean;
    selectedIds: Set<Id>;
    onToggleSelected: (channelId: Id) => void;
    isGroupHidden: (key: string) => boolean;
    providerIcons: Record<string, string>;
    userId?: Id;
    workspaceColor?: string;
    onDelete: (channel: NotificationChannel) => void;
    onEdit: (channel: NotificationChannel) => void;
    onInspect: (channel: NotificationChannel) => void;
    onTest: (channel: NotificationChannel) => void;
    onToggle: (channel: NotificationChannel) => void;
    onToggleGroup: (key: string) => void;
}

const COLUMN_COUNT = 8;

export default function GroupedRows({
    channels,
    collapsedGroups,
    isAdmin,
    selectedIds,
    onToggleSelected,
    isGroupHidden,
    providerIcons,
    userId,
    workspaceColor,
    onDelete,
    onEdit,
    onInspect,
    onTest,
    onToggle,
    onToggleGroup,
}: GroupedRowsProps) {
    const sections = useMemo(
        () => groupHierarchicalItems(channels, channel => channel.group),
        [channels],
    );

    return sections.map((section, sectionIndex) => {
        const lastHeader = section.headers[section.headers.length - 1];
        const itemIndent = lastHeader ? (lastHeader.depth + 1) * 16 : 0;
        const hideItems = section.group ? isGroupHidden(section.group) : false;
        const visibleHeaders = section.headers.filter(header => {
            const parentKey = header.key.split('/').slice(0, -1).join('/');
            return !parentKey || !isGroupHidden(parentKey);
        });
        if (hideItems && visibleHeaders.length === 0) return null;

        return (
            <React.Fragment key={sectionIndex}>
                {visibleHeaders.map(header => (
                    <S.GroupRow key={header.key}>
                        <td colSpan={COLUMN_COUNT}>
                            <S.GroupHeaderButton type="button" $depth={header.depth} onClick={() => onToggleGroup(header.key)}>
                                <Icon icon={collapsedGroups.has(header.key) ? 'lucide:chevron-right' : 'lucide:chevron-down'} width={12} />
                                <Icon icon="lucide:folder" width={12} />
                                <span>{header.label}</span>
                                <S.GroupCount>({header.count})</S.GroupCount>
                            </S.GroupHeaderButton>
                        </td>
                    </S.GroupRow>
                ))}
                {!hideItems && section.items.map(channel => (
                    <ChannelRow
                        key={channel.id}
                        channel={channel}
                        canManage={isAdmin || channel.user_id === userId}
                        selected={selectedIds.has(channel.id)}
                        onToggleSelected={onToggleSelected}
                        indent={itemIndent}
                        providerIcons={providerIcons}
                        workspaceColor={workspaceColor}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onInspect={onInspect}
                        onTest={onTest}
                        onToggle={onToggle}
                    />
                ))}
            </React.Fragment>
        );
    });
}
