import React from 'react';
import Modal from '@/Shared/UI/Modal/Modal';
import type { Integration } from '@/Domains/Integration/types';
import type { ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import { getProviderConfig, type ProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import ExternalAppCreateForm from './ExternalAppCreateForm';
import FieldsCreateForm from './FieldsCreateForm';
import IntegrationEditForm from './IntegrationEditForm';
import AiIntegrationForm from './AiIntegrationForm';

export interface IntegrationFormModalCreateProps {
    mode: 'create';
    providerConfig: ProviderConfig;
    teams: ScopeTeam[];
    onClose: () => void;
    onCreated?: (integration: Integration) => void;
    zIndex?: number;
    quickMode?: boolean;
    onDelete?: never;
    isAdmin?: never;
}

export interface IntegrationFormModalEditProps {
    mode: 'edit';
    integration: Integration;
    teams: ScopeTeam[];
    onClose: () => void;
    onCreated?: never;
    zIndex?: number;
    quickMode?: never;
    onDelete: (integration: Integration) => void;
    isAdmin: boolean;
    deletingId?: Id | null;
}

export type IntegrationFormModalProps = IntegrationFormModalCreateProps | IntegrationFormModalEditProps;

export default function IntegrationFormModal(props: IntegrationFormModalProps) {
    const { mode, onClose } = props;

    const providerConfig = mode === 'create'
        ? props.providerConfig
        : getProviderConfig(props.integration.provider)!;

    const title = mode === 'create'
        ? `Connect ${providerConfig.label}`
        : `${providerConfig.label} - ${(props as IntegrationFormModalEditProps).integration.name}`;

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={title}
            width="460px"
            zIndex={props.zIndex}
            modalKind={props.mode === 'create' && props.quickMode ? 'integration-quick-create' : undefined}
        >
            {providerConfig.aiFlow ? (
                <AiIntegrationForm
                    providerConfig={providerConfig}
                    teams={props.teams}
                    integration={mode === 'edit' ? (props as IntegrationFormModalEditProps).integration : undefined}
                    isAdmin={mode === 'edit' ? (props as IntegrationFormModalEditProps).isAdmin : undefined}
                    deletingId={mode === 'edit' ? (props as IntegrationFormModalEditProps).deletingId : undefined}
                    onClose={onClose}
                    onDelete={mode === 'edit' ? (props as IntegrationFormModalEditProps).onDelete : undefined}
                    onCreated={mode === 'create' ? props.onCreated : undefined}
                />
            ) : mode === 'create' && providerConfig.externalAppFlow ? (
                <ExternalAppCreateForm
                    providerConfig={providerConfig}
                    externalAppConfig={providerConfig.externalAppFlow}
                    onClose={onClose}
                />
            ) : mode === 'create' ? (
                <FieldsCreateForm
                    providerConfig={providerConfig}
                    teams={props.teams}
                    onClose={onClose}
                    onCreated={props.onCreated}
                    modalZIndex={props.zIndex}
                />
            ) : (
                <IntegrationEditForm
                    integration={(props as IntegrationFormModalEditProps).integration}
                    providerConfig={providerConfig}
                    teams={props.teams}
                    isAdmin={(props as IntegrationFormModalEditProps).isAdmin}
                    deletingId={(props as IntegrationFormModalEditProps).deletingId}
                    onClose={onClose}
                    onDelete={(props as IntegrationFormModalEditProps).onDelete}
                />
            )}
        </Modal>
    );
}
