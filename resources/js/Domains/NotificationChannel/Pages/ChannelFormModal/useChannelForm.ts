import { usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import type { CreatedNotificationChannel, NotificationChannel } from '@/Domains/NotificationChannel/types';
import type { PageProps } from '@/App/types';
import type { MessengerIntegration } from './utils';
import { useChannelFormState } from './useChannelFormState';
import { useChannelSubmission } from './useChannelSubmission';

interface UseChannelFormParams {
    mode: 'create' | 'edit';
    channel?: NotificationChannel | null;
    messengerIntegrations: MessengerIntegration[];
    onClose: () => void;
    onCreated?: (channel: CreatedNotificationChannel) => void;
}

// Composes channel form state and submission behavior for ChannelFormModal.
export function useChannelForm({
    mode,
    channel,
    messengerIntegrations,
    onClose,
    onCreated,
}: UseChannelFormParams) {
    const { auth } = usePage<InertiaPageProps & PageProps>().props;
    const currentUserWorkspaceRole = auth.user?.workspace_role ?? 'member';
    const form = useChannelFormState({ mode, channel, messengerIntegrations });
    const submission = useChannelSubmission({
        mode,
        channel,
        currentUserId: auth.user?.id ?? '',
        currentUserWorkspaceRole,
        form,
        onClose,
        onCreated,
    });

    return {
        availableMessengers: form.availableMessengers,
        filteredIntegrations: form.filteredIntegrations,
        selectedIntegration: form.selectedIntegration,
        messenger: form.messenger,
        integrationId: form.integrationId,
        channelName: form.channelName,
        scope: form.scope,
        teamId: form.teamId,
        ownerId: form.ownerId,
        group: form.group,
        nameError: form.nameError,
        chatOptions: form.chatOptions,
        selectedChatId: form.selectedChatId,
        detectResult: form.detectResult,
        saving: form.saving,
        chatReady: form.chatReady,
        canSubmit: !!form.integrationId && !!form.chatReady && form.channelName.trim().length > 0,
        ownershipDisabled: submission.ownershipDisabled,
        ConfirmModal: submission.ConfirmModal,
        handleMessengerChange: form.handleMessengerChange,
        handleIntegrationChange: form.handleIntegrationChange,
        handleSubmit: submission.handleSubmit,
        setChannelName: form.setChannelName,
        setScope: form.setScope,
        setTeamId: form.setTeamId,
        setOwnerId: form.setOwnerId,
        setTargetUserRole: form.setTargetUserRole,
        setGroup: form.setGroup,
        setNameError: form.setNameError,
        setChatOptions: form.setChatOptions,
        setSelectedChatId: form.setSelectedChatId,
        setDetectResult: form.setDetectResult,
    };
}
