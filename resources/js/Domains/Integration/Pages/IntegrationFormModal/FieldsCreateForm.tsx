import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { Hint } from './FieldsCreateForm.styled';
import Modal from '@/Shared/UI/Modal/Modal';
import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import type { ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import type { Integration } from '@/Domains/Integration/types';
import type { ProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import ConnectionValidation from './components/ConnectionValidation/ConnectionValidation';
import DynamicFields from './components/DynamicFields/DynamicFields';
import OwnershipScopeFields from './components/OwnershipScopeFields/OwnershipScopeFields';
import { useIntegrationCreateForm } from './hooks/useIntegrationCreateForm';
import * as S from './shared.styled';

interface Props {
    providerConfig: ProviderConfig;
    teams: ScopeTeam[];
    onClose: () => void;
    onCreated?: (integration: Integration) => void;
    modalZIndex?: number;
}

export default function FieldsCreateForm({ providerConfig, teams, onClose, onCreated, modalZIndex }: Props) {
    const form = useIntegrationCreateForm({ providerConfig, onClose, onCreated });

    return (
        <>
            <S.Form onSubmit={form.handleSubmit}>
                <Input
                    label="Integration name"
                    value={form.name}
                    onChange={event => form.handleNameChange(event.target.value)}
                    error={form.errors.name}
                    placeholder={`my-${providerConfig.provider}`}
                    autoFocus
                />

                <OwnershipScopeFields
                    scope={form.scope}
                    teamId={form.teamId}
                    teams={teams}
                    onScopeChange={form.handleScopeChange}
                />

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

                {form.hasFields && (
                    <DynamicFields
                        fields={providerConfig.fields}
                        values={form.config}
                        errors={form.errors}
                        onChange={form.setField}
                        getPlaceholder={form.resolveFieldPlaceholder}
                        onCopy={form.copyFieldValue}
                    />
                )}

                {form.requiresConnectionTest && (
                    <ConnectionValidation
                        result={form.validResult}
                        validating={form.validating}
                        onValidate={form.handleTestConnection}
                        disabled={!form.allFieldsFilled}
                    />
                )}

                {providerConfig.hint && <Hint>{providerConfig.hint}</Hint>}

                <S.Actions>
                    <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" size="sm" loading={form.submitting} disabled={!form.canCreate}>
                        <Icon icon="lucide:plug" width={14} />
                        Connect
                    </Button>
                </S.Actions>
            </S.Form>

            {providerConfig.setupGuide && (
                <Modal
                    isOpen={form.guideOpen}
                    onClose={() => form.setGuideOpen(false)}
                    title={providerConfig.setupGuide.title}
                    width="480px"
                    zIndex={modalZIndex === undefined ? undefined : modalZIndex + 1}
                >
                    <S.GuideSteps>
                        {providerConfig.setupGuide.steps.map((step, i) => (
                            <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
                        ))}
                    </S.GuideSteps>
                </Modal>
            )}
        </>
    );
}
