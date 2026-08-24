import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import {
    ExternalBanner,
    ExternalBannerHint,
    ExternalBannerIcon,
    ExternalBannerText,
    WebhookField,
    WebhookHint,
    WebhookRow,
} from './IntegrationEditForm.styled';
import { useToast } from '@/App/Hooks/useToast';
import Modal from '@/Shared/UI/Modal/Modal';
import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import type { ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import type { Integration } from '@/Domains/Integration/types';
import type { ProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import ConnectionValidation from './components/ConnectionValidation/ConnectionValidation';
import DynamicFields from './components/DynamicFields/DynamicFields';
import OwnershipScopeFields from './components/OwnershipScopeFields/OwnershipScopeFields';
import { useIntegrationEditForm } from './hooks/useIntegrationEditForm';
import * as S from './shared.styled';

interface Props {
    integration: Integration;
    providerConfig: ProviderConfig;
    teams: ScopeTeam[];
    isAdmin: boolean;
    deletingId?: Id | null;
    onClose: () => void;
    onDelete: (integration: Integration) => void;
}

export default function IntegrationEditForm({ integration, providerConfig, teams, isAdmin, deletingId, onClose, onDelete }: Props) {
    const hasFields = providerConfig.fields.length > 0;
    const form = useIntegrationEditForm({ integration, onClose });
    const { ConfirmModal } = form;
    const { toast } = useToast();
    const webhookUrl = ['gitlab', 'gitea', 'bitbucket'].includes(integration.provider)
        ? integration.webhook_url
        : null;

    const copyWebhookUrl = () => {
        if (!webhookUrl) return;
        navigator.clipboard.writeText(webhookUrl)
            .then(() => toast('Webhook URL copied to clipboard'))
            .catch(() => toast('Unable to copy webhook URL', 'error'));
    };

    return (
        <>
            <S.Form onSubmit={form.handleSubmit}>
                <Input
                    label="Name"
                    value={form.name}
                    onChange={event => form.handleNameChange(event.target.value)}
                    error={form.errors.name}
                    disabled={integration.is_readonly}
                />

                <OwnershipScopeFields
                    scope={form.scope}
                    teamId={form.teamId}
                    ownerId={form.ownerId}
                    teams={teams}
                    disabled={form.ownershipDisabled}
                    disabledHint={integration.is_readonly
                        ? 'This integration is managed by the instance and is read-only.'
                        : undefined}
                    onScopeChange={form.handleScopeChange}
                    onOwnerChange={form.setOwnerId}
                    onOwnerSelect={user => form.setTargetUserRole(user?.workspace_role)}
                />

                {providerConfig.externalAppFlow && integration.provider_external_url && (
                    <ExternalBanner
                        href={integration.provider_external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ExternalBannerIcon>
                            <Icon icon={providerConfig.icon} width={16} />
                        </ExternalBannerIcon>
                        <ExternalBannerText>
                            <span>Configure repository access on {providerConfig.label}</span>
                            <ExternalBannerHint>Manage which repositories this integration can access</ExternalBannerHint>
                        </ExternalBannerText>
                        <Icon icon="lucide:external-link" width={14} />
                    </ExternalBanner>
                )}

                {webhookUrl && (
                    <WebhookField>
                        <WebhookRow>
                            <Input label="Webhook URL" value={webhookUrl} readOnly />
                            <Button type="button" size="sm" variant="secondary" onClick={copyWebhookUrl}>
                                <Icon icon="lucide:copy" width={14} />
                                Copy
                            </Button>
                        </WebhookRow>
                        <WebhookHint>
                            Configure this URL and the secret below in your repository provider.
                        </WebhookHint>
                    </WebhookField>
                )}

                {providerConfig.setupGuide && (
                    <S.GuideLink type="button" onClick={() => form.setGuideOpen(true)}>
                        <Icon icon="lucide:book-open" width={13} />
                        {providerConfig.setupGuide.title}
                    </S.GuideLink>
                )}
                {!providerConfig.setupGuide && providerConfig.docUrl && (
                    <S.DocLink href={providerConfig.docUrl} target="_blank" rel="noopener noreferrer">
                        <Icon icon="lucide:external-link" width={13} />
                        {providerConfig.docLabel || 'Documentation'}
                    </S.DocLink>
                )}

                {hasFields && (
                    <DynamicFields
                        fields={providerConfig.fields}
                        values={form.config}
                        errors={form.errors}
                        onChange={form.setField}
                        getPlaceholder={() => 'Leave empty to keep current value'}
                        disabled={integration.is_readonly}
                    />
                )}

                {hasFields && (
                    <ConnectionValidation
                        result={form.validResult}
                        validating={form.validating}
                        onValidate={form.handleTestConnection}
                    />
                )}

                <S.Actions>
                    {isAdmin && !integration.is_readonly && (
                        <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() => onDelete(integration)}
                            loading={deletingId === integration.id}
                            style={{ marginRight: 'auto' }}
                        >
                            <Icon icon="lucide:trash-2" width={14} />
                            Delete
                        </Button>
                    )}
                    <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                        {integration.is_readonly ? 'Close' : 'Cancel'}
                    </Button>
                    {!integration.is_readonly && (
                        <Button type="submit" size="sm" loading={form.submitting}>
                            Save
                        </Button>
                    )}
                </S.Actions>
            </S.Form>

            {providerConfig.setupGuide && (
                <Modal
                    isOpen={form.guideOpen}
                    onClose={() => form.setGuideOpen(false)}
                    title={providerConfig.setupGuide.title}
                    width="480px"
                >
                    <S.GuideSteps>
                        {providerConfig.setupGuide.steps.map((step, i) => (
                            <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
                        ))}
                    </S.GuideSteps>
                </Modal>
            )}
            <ConfirmModal />
        </>
    );
}
