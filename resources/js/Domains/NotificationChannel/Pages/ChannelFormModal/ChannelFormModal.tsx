import Modal from '@/Shared/UI/Modal/Modal';
import Button from '@/Shared/UI/Button/Button';
import type { ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import type { Integration, IntegrationProvider } from '@/Domains/Integration/types';
import type { CreatedNotificationChannel, NotificationChannel } from '@/Domains/NotificationChannel/types';
import IntegrationProviderSelector from '@/Shared/UI/IntegrationProviderSelector/IntegrationProviderSelector';
import ChatDetection from './components/ChatDetection/ChatDetection';
import ConnectionSelect from './components/ConnectionSelect/ConnectionSelect';
import GroupSelector from './components/GroupSelector/GroupSelector';
import IdentityFields from './components/IdentityFields/IdentityFields';
import { PROVIDER_META } from './config';
import { useChannelForm } from './useChannelForm';

export interface ChannelFormModalProps {
    mode: 'create' | 'edit';
    channel?: NotificationChannel | null;
    messengerIntegrations: Pick<Integration, 'id' | 'name' | 'provider'>[];
    groups: string[];
    teams: ScopeTeam[];
    isAdmin: boolean;
    onClose: () => void;
    onCreated?: (channel: CreatedNotificationChannel) => void;
    zIndex?: number;
    quickMode?: boolean;
}

export default function ChannelFormModal({
    mode,
    channel,
    messengerIntegrations,
    groups,
    teams,
    onClose,
    onCreated,
    zIndex,
    quickMode,
}: ChannelFormModalProps) {
    const form = useChannelForm({ mode, channel, messengerIntegrations, onClose, onCreated });
    const { ConfirmModal } = form;

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={mode === 'create' ? 'New Notification Channel' : 'Edit Channel'}
            width="500px"
            zIndex={zIndex}
            modalKind={quickMode ? 'channel-quick-create' : undefined}
        >
            <form onSubmit={form.handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <IntegrationProviderSelector
                    providers={form.availableMessengers}
                    value={form.messenger}
                    onChange={form.handleMessengerChange}
                    label="Messenger"
                    providerMeta={PROVIDER_META}
                    category="messenger"
                    emptyMessage="No messenger integrations available. Set up a messenger integration first."
                    onIntegrationCreated={(provider, integrationId) => {
                        form.handleMessengerChange(provider);
                        form.handleIntegrationChange(integrationId);
                    }}
                />

                {messengerIntegrations.length > 0 && (
                    <>
                {form.messenger && (
                    <ConnectionSelect
                        integrations={form.filteredIntegrations}
                        value={form.integrationId}
                        onChange={form.handleIntegrationChange}
                        providerMeta={PROVIDER_META[form.messenger]}
                        providerName={form.messenger}
                        creationProvider={form.messenger as IntegrationProvider}
                        creationCategory="messenger"
                    />
                )}

                {form.integrationId && form.selectedIntegration && (
                    <ChatDetection
                        key={`${mode}-${channel?.id ?? 'new'}-${form.integrationId}`}
                        integrationId={form.selectedIntegration.id}
                        provider={form.selectedIntegration?.provider as string | undefined}
                        chatOptions={form.chatOptions}
                        selectedChatId={form.selectedChatId}
                        detectResult={form.detectResult}
                        onChatOptionsChange={form.setChatOptions}
                        onSelectedChatIdChange={form.setSelectedChatId}
                        onDetectResultChange={form.setDetectResult}
                    />
                )}

                {form.chatReady && (
                    <IdentityFields
                        channelName={form.channelName}
                        nameError={form.nameError}
                        scope={form.scope}
                        teamId={form.teamId}
                        ownerId={form.ownerId}
                        teams={teams}
                        ownershipDisabled={form.ownershipDisabled}
                        groupSelector={<GroupSelector groups={groups} value={form.group} onChange={form.setGroup} />}
                        onChannelNameChange={form.setChannelName}
                        onNameErrorClear={() => form.setNameError('')}
                        onScopeChange={(nextScope, nextTeamId) => {
                            form.setScope(nextScope);
                            form.setTeamId(nextTeamId);
                        }}
                        onOwnerChange={form.setOwnerId}
                        onOwnerRoleChange={form.setTargetUserRole}
                    />
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                    <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={!form.canSubmit} loading={form.saving}>
                        {mode === 'create' ? 'Create Channel' : 'Update Channel'}
                    </Button>
                </div>
                    </>
                )}
            </form>
            <ConfirmModal />
        </Modal>
    );
}
