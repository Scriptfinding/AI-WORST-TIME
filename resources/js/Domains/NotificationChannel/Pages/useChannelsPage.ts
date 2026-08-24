import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import type { NotificationChannel } from '@/Domains/NotificationChannel/types';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';

export interface ChannelUsage {
    flow_id: Id;
    flow_name: string;
    icon_type?: string;
    icon_value?: string | null;
    icon_color?: string | null;
    icon_url?: string | null;
}

// Manages channel modal selection and asynchronously loads usage details.
export default function useChannelsPage(channels: NotificationChannel[]) {
    const [showCreate, setShowCreate] = useState(false);
    const {
        selectedItem: editChannel,
        openModal: openEdit,
        closeModal: closeEdit,
    } = useUrlSyncedModal(channels, 'edit');
    const [inspectChannel, setInspectChannel] = useState<NotificationChannel | null>(null);
    const [inspectUsages, setInspectUsages] = useState<ChannelUsage[]>([]);
    const [inspectLoading, setInspectLoading] = useState(false);

    useEffect(() => {
        if (!inspectChannel) return;

        let cancelled = false;
        setInspectUsages([]);
        setInspectLoading(true);

        axios.get<ChannelUsage[]>(`/channels/${inspectChannel.id}/usages`)
            .then(({ data }) => {
                if (!cancelled) setInspectUsages(data);
            })
            .catch(() => {
                // Keep the empty state when usage inspection is unavailable.
            })
            .finally(() => {
                if (!cancelled) setInspectLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [inspectChannel]);

    const openCreate = useCallback(() => setShowCreate(true), []);
    const closeCreate = useCallback(() => setShowCreate(false), []);
    const openInspect = useCallback((channel: NotificationChannel) => setInspectChannel(channel), []);
    const closeInspect = useCallback(() => setInspectChannel(null), []);

    return {
        closeCreate,
        closeEdit,
        closeInspect,
        editChannel,
        inspectChannel,
        inspectLoading,
        inspectUsages,
        openCreate,
        openEdit,
        openInspect,
        showCreate,
    };
}
