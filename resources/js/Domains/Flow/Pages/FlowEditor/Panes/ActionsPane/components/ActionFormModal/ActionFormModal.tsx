import type { FormEvent } from 'react';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import ScopePicker from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import Switch from '@/Shared/UI/Switch/Switch';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import { OWNERSHIP_DISABLED_HINT } from '@/Shared/Utils/ownershipPermissions';
import type { FlowAction, WebhookHeader } from '@/Domains/Flow/types';
import type { IntegrationScope } from '@/Domains/Integration/types';
import type { ActionFormData, TeamOption } from '@/Domains/Flow/Pages/FlowEditor/Panes/ActionsPane/types';
import ArtifactOverrides from '@/Domains/Flow/Pages/FlowEditor/Panes/ActionsPane/components/ArtifactOverrides/ArtifactOverrides';
import GroupField from '@/Shared/UI/GroupField/GroupField';
import WebhookHeaders from '@/Domains/Flow/Pages/FlowEditor/Panes/ActionsPane/components/WebhookHeaders/WebhookHeaders';
import * as S from './styled';

interface ActionFormModalProps {
    isOpen: boolean;
    editing: FlowAction | null;
    data: ActionFormData;
    processing: boolean;
    headers: WebhookHeader[];
    group: string;
    groups: string[];
    scope: IntegrationScope;
    teamId: Id | null;
    ownerId: Id | null;
    teams: TeamOption[];
    ownershipDisabled: boolean;
    recordingEnabled: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent) => void;
    onFieldChange: <Key extends keyof ActionFormData>(field: Key, value: ActionFormData[Key]) => void;
    onHeadersChange: (headers: WebhookHeader[]) => void;
    onGroupChange: (group: string) => void;
    onScopeChange: (scope: IntegrationScope, teamId: Id | null) => void;
    onOwnerChange: (ownerId: Id | null) => void;
    onOwnerRoleChange: (role: string | undefined) => void;
}

export default function ActionFormModal({
    isOpen,
    editing,
    data,
    processing,
    headers,
    group,
    groups,
    scope,
    teamId,
    ownerId,
    teams,
    ownershipDisabled,
    recordingEnabled,
    onClose,
    onSubmit,
    onFieldChange,
    onHeadersChange,
    onGroupChange,
    onScopeChange,
    onOwnerChange,
    onOwnerRoleChange,
}: ActionFormModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? 'Edit Action' : 'New Webhook Action'}
        >
            <S.Form onSubmit={onSubmit}>
                <Input
                    label="Label"
                    value={data.label}
                    onChange={event => onFieldChange('label', event.target.value)}
                    placeholder="My action"
                    autoFocus
                />

                <GroupField
                    value={group}
                    groups={groups}
                    isModalOpen={isOpen}
                    onChange={onGroupChange}
                />

                <Input
                    label="Webhook URL"
                    value={data.url}
                    onChange={event => onFieldChange('url', event.target.value)}
                    placeholder="https://example.com/webhook"
                />
                <Input
                    label="HMAC Secret (Optional)"
                    value={data.secret}
                    onChange={event => onFieldChange('secret', event.target.value)}
                    placeholder="HMAC-SHA256 secret"
                    type="password"
                />

                <WebhookHeaders headers={headers} onChange={onHeadersChange} />

                <Switch
                    id="fire-on-error"
                    checked={data.fire_on_error}
                    onChange={value => onFieldChange('fire_on_error', value)}
                    label="Fire on error"
                />

                <ScopePicker
                    label="Visibility"
                    value={{ scope, team_id: teamId }}
                    onChange={value => onScopeChange(value.scope as IntegrationScope, value.team_id)}
                    teams={teams}
                    ownerLabel="Owner"
                    ownerScope="owner"
                    disabled={ownershipDisabled}
                    disabledHint={OWNERSHIP_DISABLED_HINT}
                />

                {editing && (
                    <UserPicker
                        label="Owner"
                        value={ownerId}
                        onChange={onOwnerChange}
                        onSelect={user => onOwnerRoleChange(user?.workspace_role ?? undefined)}
                        placeholder="Myself (default)"
                        disabled={ownershipDisabled}
                    />
                )}

                <ArtifactOverrides
                    data={data}
                    recordingEnabled={recordingEnabled}
                    onChange={onFieldChange}
                />

                <S.Actions>
                    <Button type="submit" size="sm" disabled={processing}>
                        {processing ? 'Saving...' : editing ? 'Update Action' : 'Create Action'}
                    </Button>
                </S.Actions>
            </S.Form>
        </Modal>
    );
}
