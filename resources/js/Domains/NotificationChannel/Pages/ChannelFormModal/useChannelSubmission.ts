import type { FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { CreatedNotificationChannel, NotificationChannel } from '@/Domains/NotificationChannel/types';
import { invalidateChannelCache } from '@/Domains/Flow/Pages/FlowEditor/utils/channelSuggestions';
import { ADMIN_TRANSFER_WARNING, canEditOwnership } from '@/Shared/Utils/ownershipPermissions';
import type { WorkspaceRole } from '@/Shared/Utils/ownershipPermissions';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import { normalizeLaravelValidationErrors } from '@/Shared/Utils/laravelValidation';
import type { ChannelFormState } from './useChannelFormState';

interface UseChannelSubmissionParams {
    mode: 'create' | 'edit';
    channel?: NotificationChannel | null;
    currentUserId: Id;
    currentUserWorkspaceRole: WorkspaceRole;
    form: ChannelFormState;
    onClose: () => void;
    onCreated?: (channel: CreatedNotificationChannel) => void;
}

// Validates ownership and submits create or edit requests from the channel form.
export function useChannelSubmission({
    mode,
    channel,
    currentUserId,
    currentUserWorkspaceRole,
    form,
    onClose,
    onCreated,
}: UseChannelSubmissionParams) {
    const { confirm, ConfirmModal } = useConfirm();
    const ownershipDisabled = mode === 'edit' && channel
        ? !canEditOwnership({
            currentUserId,
            currentUserWorkspaceRole,
            resourceOwnerId: channel.user_id,
            ownerWorkspaceRole: channel.owner_workspace_role,
        })
        : false;

    const buildPayload = () => ({
        name: form.channelName.trim(),
        messenger_integration_id: form.integrationId,
        config: {
            chat_id: form.detectResult?.chat_id || form.selectedChatId,
            chat_name: form.detectResult?.chat_name,
        },
        scope: form.scope,
        team_id: form.scope === 'team' ? form.teamId : null,
        group: form.group || null,
        ...(form.ownerId ? { user_id: form.ownerId } : {}),
    });

    const submitUpdate = () => {
        if (!channel || !form.integrationId || !form.detectResult?.ok) return;
        form.setSaving(true);
        form.setNameError('');
        router.put(`/channels/${channel.id}`, buildPayload() as Parameters<typeof router.put>[1], {
            preserveState: true,
            onSuccess: () => {
                invalidateChannelCache();
                form.setSaving(false);
                onClose();
            },
            onError: errors => {
                form.setSaving(false);
                form.setNameError(errors.name || 'Error');
            },
        });
    };

    const confirmOwnershipTransfer = async () => {
        const originalOwnerId = mode === 'edit' && channel ? channel.user_id : null;
        let adminTransferWarned = false;

        if (
            currentUserWorkspaceRole === 'manager'
            && form.targetUserRole === 'admin'
            && form.ownerId
            && form.ownerId !== originalOwnerId
            && form.ownerId !== currentUserId
        ) {
            const accepted = await confirm({
                title: 'Transfer ownership',
                message: ADMIN_TRANSFER_WARNING,
                confirmLabel: 'Transfer anyway',
                variant: 'danger',
            });
            if (!accepted) return false;
            adminTransferWarned = true;
        }

        if (
            !adminTransferWarned
            && form.ownerId
            && form.ownerId !== originalOwnerId
            && form.ownerId !== currentUserId
            && form.scope === 'user'
        ) {
            return confirm({
                title: 'Transfer ownership',
                message: 'This channel has personal visibility. By transferring it to another user, you will permanently lose access to it.',
                confirmLabel: 'Transfer anyway',
                variant: 'danger',
            });
        }

        return true;
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!form.integrationId || !form.detectResult?.ok || !form.channelName.trim()) return;
        if (!await confirmOwnershipTransfer()) return;

        if (mode === 'edit' && channel) {
            submitUpdate();
            return;
        }

        form.setSaving(true);
        form.setNameError('');
        if (onCreated) {
            try {
                const response = await fetch('/channels', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        ...csrfHeaders(),
                    },
                    body: JSON.stringify(buildPayload()),
                });
                const data = await response.json().catch(() => ({})) as {
                    channel?: CreatedNotificationChannel;
                    message?: string;
                    errors?: unknown;
                };
                if (!response.ok || !data.channel) {
                    const errors = normalizeLaravelValidationErrors(data.errors);
                    form.setNameError(errors.name || data.message || 'Unable to create the channel.');
                    return;
                }
                invalidateChannelCache();
                onCreated(data.channel);
            } catch {
                form.setNameError('Unable to create the channel.');
            } finally {
                form.setSaving(false);
            }
            return;
        }

        router.post('/channels', buildPayload() as Parameters<typeof router.post>[1], {
            preserveState: true,
            onSuccess: () => {
                invalidateChannelCache();
                form.setSaving(false);
                onClose();
            },
            onError: errors => {
                form.setSaving(false);
                form.setNameError(errors.name || 'Error');
            },
        });
    };

    return {
        ConfirmModal,
        handleSubmit,
        ownershipDisabled,
    };
}
