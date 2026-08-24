import { useEffect, useState } from 'react';
import type { NotificationChannel } from '@/Domains/NotificationChannel/types';
import {
    type ChatOption,
    type DetectResult,
    type MessengerIntegration,
    getAvailableMessengers,
    getIntegrationsForMessenger,
} from './utils';

interface UseChannelFormStateParams {
    mode: 'create' | 'edit';
    channel?: NotificationChannel | null;
    messengerIntegrations: MessengerIntegration[];
}

// Owns channel field state and derives compatible messenger and chat options.
export function useChannelFormState({
    mode,
    channel,
    messengerIntegrations,
}: UseChannelFormStateParams) {
    const [messenger, setMessenger] = useState<string | null>(null);
    const [integrationId, setIntegrationId] = useState<Id | null>(null);
    const [channelName, setChannelName] = useState('');
    const [scope, setScope] = useState('user');
    const [teamId, setTeamId] = useState<Id | null>(null);
    const [ownerId, setOwnerId] = useState<Id | null>(null);
    const [targetUserRole, setTargetUserRole] = useState<string | undefined>();
    const [group, setGroup] = useState('');
    const [nameError, setNameError] = useState('');
    const [chatOptions, setChatOptions] = useState<ChatOption[]>([]);
    const [selectedChatId, setSelectedChatId] = useState('');
    const [detectResult, setDetectResult] = useState<DetectResult | null>(null);
    const [saving, setSaving] = useState(false);

    const availableMessengers = getAvailableMessengers(messengerIntegrations);
    const filteredIntegrations = getIntegrationsForMessenger(messengerIntegrations, messenger);
    const selectedIntegration = messengerIntegrations.find(integration => integration.id === integrationId);
    const chatReady = detectResult?.ok && selectedChatId;

    useEffect(() => {
        if (mode === 'edit' && channel) {
            const editIntegration = messengerIntegrations.find(
                integration => integration.id === channel.messenger_integration_id,
            );
            setMessenger(editIntegration ? (editIntegration.provider as string) : null);
            setIntegrationId(channel.messenger_integration_id);
            setChannelName(channel.name);
            setScope(channel.scope);
            setTeamId(channel.team_id ?? null);
            setOwnerId(channel.user_id);
            setTargetUserRole(channel.owner_workspace_role);
            setGroup(channel.group || '');
            setSelectedChatId(channel.config?.chat_id || '');
            setChatOptions(channel.config?.chat_id
                ? [{
                    id: channel.config.chat_id,
                    name: channel.config.chat_name || channel.config.chat_id,
                }]
                : []);
            setDetectResult(channel.config?.chat_id
                ? {
                    ok: true,
                    chat_id: channel.config.chat_id,
                    chat_name: channel.config.chat_name,
                }
                : null);
        } else {
            setMessenger(null);
            setIntegrationId(null);
            setChannelName('');
            setScope('user');
            setTeamId(null);
            setOwnerId(null);
            setTargetUserRole(undefined);
            setGroup('');
            setChatOptions([]);
            setSelectedChatId('');
            setDetectResult(null);
        }
        setNameError('');
        setSaving(false);
        // Reset only when the modal target changes, not when parent collections are refreshed.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, channel?.id]);

    const resetChat = () => {
        setChatOptions([]);
        setSelectedChatId('');
        setDetectResult(null);
    };

    const handleMessengerChange = (provider: string) => {
        setMessenger(provider);
        resetChat();
        const matching = messengerIntegrations.filter(
            integration => (integration.provider as string) === provider,
        );
        setIntegrationId(matching.length === 1 ? matching[0].id : null);
    };

    const handleIntegrationChange = (id: Id) => {
        setIntegrationId(id);
        resetChat();
    };

    return {
        availableMessengers,
        filteredIntegrations,
        selectedIntegration,
        messenger,
        integrationId,
        channelName,
        scope,
        teamId,
        ownerId,
        targetUserRole,
        group,
        nameError,
        chatOptions,
        selectedChatId,
        detectResult,
        saving,
        chatReady,
        handleMessengerChange,
        handleIntegrationChange,
        setChannelName,
        setScope,
        setTeamId,
        setOwnerId,
        setTargetUserRole,
        setGroup,
        setNameError,
        setChatOptions,
        setSelectedChatId,
        setDetectResult,
        setSaving,
    };
}

export type ChannelFormState = ReturnType<typeof useChannelFormState>;
