import { useEffect, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router, usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { BtnLabel, HeaderActions } from './styled';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import FeatureUnavailablePanel from '@/Domains/Licensing/Components/FeatureFlags/FeatureUnavailablePanel/FeatureUnavailablePanel';
import Button from '@/Shared/UI/Button/Button';
import BulkDeleteConfirmation from '@/Shared/UI/BulkDeleteConfirmation/BulkDeleteConfirmation';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { Integration } from '@/Domains/Integration/types';
import { IntegrationCreationProvider } from '@/Domains/Integration/Contexts/IntegrationCreationContext';
import type { NotificationChannel } from '@/Domains/NotificationChannel/types';
import { invalidateChannelCache } from '@/Domains/Flow/Pages/FlowEditor/utils/channelSuggestions';
import type { PageProps } from '@/App/types';
import ChannelTable from './ChannelTable/ChannelTable';
import ChannelModals from './ChannelModals/ChannelModals';
import useChannelsPage from './useChannelsPage';

interface ScopeTeam { id: string; name: string; }

interface Props {
    channels: NotificationChannel[];
    groups: string[];
    messengerIntegrations: Pick<Integration, 'id' | 'name' | 'provider'>[];
    teams: ScopeTeam[];
    filters: { search: string; group: string | null; scope: string | null };
    isAdmin: boolean;
}

export default function Channels({ channels, groups, messengerIntegrations, teams, filters, isAdmin }: Props) {
    const { settings } = usePage<InertiaPageProps & PageProps>().props;
    const { confirm, ConfirmModal } = useConfirm();
    const page = useChannelsPage(channels);
    const [selectedIds, setSelectedIds] = useState<Set<Id>>(() => new Set());
    const [deletingSelected, setDeletingSelected] = useState(false);

    useEffect(() => {
        const availableIds = new Set(channels.map(channel => channel.id));
        setSelectedIds(current => {
            const next = new Set([...current].filter(id => availableIds.has(id)));
            return next.size === current.size ? current : next;
        });
    }, [channels]);

    const toggleSelected = (channelId: Id) => {
        setSelectedIds(current => {
            const next = new Set(current);
            if (next.has(channelId)) {
                next.delete(channelId);
            } else {
                next.add(channelId);
            }
            return next;
        });
    };

    const deleteSelected = async () => {
        const selectedChannels = channels.filter(channel => selectedIds.has(channel.id));
        if (selectedChannels.length === 0) return;

        const confirmed = await confirm({
            title: selectedChannels.length === 1 ? 'Delete Channel' : 'Delete Channels',
            message: (
                <BulkDeleteConfirmation
                    description="Notifications sent to these channels will stop working."
                    items={selectedChannels.map(channel => ({
                        id: channel.id,
                        title: channel.name,
                        subtitle: `${channel.provider} - ${channel.config?.chat_name || channel.config?.chat_id || 'No destination'}`,
                        icon: <Icon icon="lucide:bell-ring" width={22} height={22} />,
                    }))}
                />
            ),
            confirmLabel: `Delete (${selectedChannels.length})`,
            variant: 'danger',
        });
        if (!confirmed) return;

        setDeletingSelected(true);
        router.delete('/channels/bulk-delete', {
            data: { ids: selectedChannels.map(channel => channel.id) },
            preserveScroll: true,
            onSuccess: () => {
                invalidateChannelCache();
                setSelectedIds(new Set());
            },
            onFinish: () => setDeletingSelected(false),
        });
    };

    return (
        <IntegrationCreationProvider
            teams={teams}
            integrationReloadKeys={['messengerIntegrations']}
        >
        <AppLayout
            title="Notification Channels"
            headerRight={settings.messenger_enabled ? (
                <HeaderActions>
                    {selectedIds.size > 0 && (
                        <Button
                            size="sm"
                            variant="danger"
                            loading={deletingSelected}
                            onClick={deleteSelected}
                        >
                            <Icon icon="lucide:trash-2" width={14} />
                            Delete ({selectedIds.size})
                        </Button>
                    )}
                    <Button size="sm" onClick={page.openCreate}>
                        <Icon icon="lucide:plus" width={14} />
                        <BtnLabel>New Channel</BtnLabel>
                    </Button>
                </HeaderActions>
            ) : undefined}
        >
            {!settings.messenger_enabled ? (
                <FeatureUnavailablePanel />
            ) : (
                <>
                    <ChannelTable
                        channels={channels}
                        groups={groups}
                        teams={teams}
                        filters={filters}
                        isAdmin={isAdmin}
                        selectedIds={selectedIds}
                        onToggleSelected={toggleSelected}
                        onOpenEdit={page.openEdit}
                        onOpenInspect={page.openInspect}
                        confirm={confirm}
                    />
                    <ChannelModals
                        groups={groups}
                        messengerIntegrations={messengerIntegrations}
                        teams={teams}
                        isAdmin={isAdmin}
                        showCreate={page.showCreate}
                        onCloseCreate={page.closeCreate}
                        editChannel={page.editChannel}
                        onCloseEdit={page.closeEdit}
                        inspectChannel={page.inspectChannel}
                        inspectUsages={page.inspectUsages}
                        inspectLoading={page.inspectLoading}
                        onCloseInspect={page.closeInspect}
                        confirm={confirm}
                    />
                </>
            )}
            <ConfirmModal />
        </AppLayout>
        </IntegrationCreationProvider>
    );
}
