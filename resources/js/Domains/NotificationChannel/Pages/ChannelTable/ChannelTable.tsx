import React from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Empty, TableWrapper, Table, Thead, Th } from './styled';
import { useAuth, useCurrentWorkspace, usePageProps } from '@/App/Hooks/usePageProps';
import { useThemeMode } from '@/App/Hooks/useThemeMode';
import type { NotificationChannel } from '@/Domains/NotificationChannel/types';
import { invalidateChannelCache } from '@/Domains/Flow/Pages/FlowEditor/utils/channelSuggestions';
import { useCollapsedGroups } from '@/Shared/UI/TableFilters/useCollapsedGroups';
import ChannelDeleteConfirmation, { type ChannelUsage } from './ChannelDeleteConfirmation';
import FilterToolbar from './components/FilterToolbar/FilterToolbar';
import GroupedRows from './components/GroupedRows/GroupedRows';
import type { ChannelTableFilters, ChannelTableTeam } from './types';

const PROVIDER_ICONS_LIGHT: Record<string, string> = {
    telegram: 'logos:telegram',
    discord: 'logos:discord-icon',
    slack: 'logos:slack-icon',
};

const PROVIDER_ICONS_DARK: Record<string, string> = {
    telegram: 'simple-icons:telegram',
    discord: 'simple-icons:discord',
    slack: 'simple-icons:slack',
};

interface Props {
    channels: NotificationChannel[];
    groups: string[];
    teams: ChannelTableTeam[];
    filters: ChannelTableFilters;
    isAdmin: boolean;
    selectedIds: Set<Id>;
    onToggleSelected: (channelId: Id) => void;
    onOpenEdit: (channel: NotificationChannel) => void;
    onOpenInspect: (channel: NotificationChannel) => void;
    confirm: (options: {
        title?: string;
        message: React.ReactNode;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: 'danger' | 'primary';
    }) => Promise<boolean>;
}

export default function ChannelTable({
    channels,
    groups,
    teams = [],
    filters,
    isAdmin,
    selectedIds,
    onToggleSelected,
    onOpenEdit,
    onOpenInspect,
    confirm,
}: Props) {
    const { user } = useAuth();
    const { settings } = usePageProps();
    const { resolved: themeMode } = useThemeMode();
    const currentWorkspace = useCurrentWorkspace();
    const providerIcons = themeMode === 'dark' ? PROVIDER_ICONS_DARK : PROVIDER_ICONS_LIGHT;
    const { collapsedGroups, isGroupHidden, toggleGroup } = useCollapsedGroups(
        `channel-collapsed-groups:${user?.id ?? 'anonymous'}`,
    );

    const handleDelete = async (channel: NotificationChannel) => {
        let usages: ChannelUsage[] = [];
        try {
            const response = await axios.get<ChannelUsage[]>(`/channels/${channel.id}/usages`);
            usages = response.data;
        } catch {
            // Proceed without usage information.
        }

        const confirmed = await confirm({
            title: 'Delete Channel',
            message: React.createElement(ChannelDeleteConfirmation, {
                channelName: channel.name,
                usages,
            }),
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (!confirmed) return;
        router.delete(`/channels/${channel.id}`, {
            onSuccess: invalidateChannelCache,
        });
    };

    const handleToggle = (channel: NotificationChannel) => {
        router.put(`/channels/${channel.id}`, { is_active: !channel.is_active }, {
            preserveState: true,
            onSuccess: invalidateChannelCache,
        });
    };

    const handleTest = (channel: NotificationChannel) => {
        router.post(`/channels/${channel.id}/test`, {}, { preserveState: true });
    };

    return (
        <>
            <FilterToolbar
                filters={filters}
                groups={groups}
                teams={teams}
                workspaceSharingEnabled={settings?.workspace_sharing_enabled ?? false}
            />
            {channels.length === 0 ? (
                <Empty>
                    {filters.search || filters.group !== null || filters.scope
                        ? 'No channels match your filters.'
                        : 'No notification channels configured yet.'
                    }
                </Empty>
            ) : (
                <TableWrapper>
                    <Table>
                        <Thead>
                            <tr>
                                <Th>Name</Th>
                                <Th>Provider</Th>
                                <Th>Connection</Th>
                                <Th>Destination</Th>
                                <Th $center>Status</Th>
                                <Th>Visibility</Th>
                                <Th>Owner</Th>
                                <Th $width={120} />
                            </tr>
                        </Thead>
                        <tbody>
                            <GroupedRows
                                channels={channels}
                                collapsedGroups={collapsedGroups}
                                isAdmin={isAdmin}
                                selectedIds={selectedIds}
                                onToggleSelected={onToggleSelected}
                                isGroupHidden={isGroupHidden}
                                providerIcons={providerIcons}
                                userId={user?.id}
                                workspaceColor={currentWorkspace?.icon_color || undefined}
                                onDelete={handleDelete}
                                onEdit={onOpenEdit}
                                onInspect={onOpenInspect}
                                onTest={handleTest}
                                onToggle={handleToggle}
                                onToggleGroup={toggleGroup}
                            />
                        </tbody>
                    </Table>
                </TableWrapper>
            )}
        </>
    );
}
