import React, { createElement, useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import Modal from '@/Shared/UI/Modal/Modal';
import Button from '@/Shared/UI/Button/Button';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import type { Integration, IntegrationCategory } from '@/Domains/Integration/types';
import type { PageProps } from '@/App/types';
import type { ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import { getProviderConfig, getProvidersByCategory, type ProviderConfig } from './providerConfig';
import CategorySection from './CategorySection/CategorySection';
import ProviderCard from './ProviderCard/ProviderCard';
import IntegrationFormModal from './IntegrationFormModal/IntegrationFormModal';
import IntegrationDeleteConfirmation from './IntegrationDeleteConfirmation';
import MailboxDomainModal from './MailboxDomainModal/MailboxDomainModal';
import { fetchDeleteUsages } from './deleteUsages/utils';
import * as S from './styled';

interface Props {
    integrations: Integration[];
    isWorkspaceAdmin: boolean;
    teams: ScopeTeam[];
}

const CATEGORIES: { key: IntegrationCategory; label: string; icon: string; description: string }[] = [
    { key: 'messenger', label: 'Messengers', icon: 'lucide:message-square', description: 'Connect messaging bots (Telegram, Discord, Slack). Use them as notification channels in your flows.' },
    { key: 'ai', label: 'AI Integrations', icon: 'lucide:sparkles', description: 'Connect language models for text tasks and AI-driven browser automation.' },
    { key: 'vault', label: 'Vaults', icon: 'lucide:lock-keyhole', description: 'Manage secrets from external vault providers. Use them as variables in your flows.' },
    { key: 'repository', label: 'Repositories', icon: 'lucide:git-branch', description: 'Pull flow code from a git repository. Link branches to flows for automatic syncing on push.' },
    { key: 'other', label: 'Other', icon: 'lucide:blocks', description: 'Additional integrations for email receiving, webhooks, and more.' },
];

export default function Integrations({ integrations, isWorkspaceAdmin, teams }: Props) {
    const { flash, auth, settings } = usePage<InertiaPageProps & PageProps>().props;
    const currentUserId = auth.user?.id ?? '';
    const managedMailboxEnabled = integrations.some(
        integration => integration.provider === 'mailbox' && integration.is_readonly,
    );
    const [createProvider, setCreateProvider] = useState<ProviderConfig | null>(null);
    const {
        selectedItem: manageIntegration,
        openModal: openManageIntegration,
        closeModal: closeManageIntegration,
    } = useUrlSyncedModal(integrations, 'edit');
    const [deletingId, setDeletingId] = useState<Id | null>(null);
    const { confirm, ConfirmModal } = useConfirm();

    const [installIntegration, setInstallIntegration] = useState<Integration | null>(null);
    const handledFlashRef = useRef<Id | null>(null);

    useEffect(() => {
        const id = flash?.external_app_integration_id;
        if (!id || id === handledFlashRef.current) return;
        handledFlashRef.current = id;
        const match = integrations.find(i => i.id === id);
        if (match) setInstallIntegration(match);
    }, [flash?.external_app_integration_id, integrations]);

    const categoryEnabled = (category: IntegrationCategory) => {
        if (category === 'ai') return settings.ai_enabled;
        if (category === 'messenger') return settings.messenger_enabled;
        if (category === 'vault') return settings.vaults_enabled;
        if (category === 'repository') return settings.vcs_enabled;
        return true;
    };

    const handleDelete = async (integration: Integration) => {
        setDeletingId(integration.id);
        try {
            const usageContent = await fetchDeleteUsages(integration);

            const ok = await confirm({
                title: 'Delete Integration',
                message: usageContent
                    ? createElement(IntegrationDeleteConfirmation, {
                        integrationName: integration.name,
                        usageContent,
                    })
                    : `Are you sure you want to delete "${integration.name}"? This cannot be undone.`,
                confirmLabel: 'Delete',
                variant: 'danger',
            });
            if (!ok) return;
            router.delete(`/integrations/${integration.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    closeManageIntegration();
                    setCreateProvider(null);
                },
            });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <AppLayout title="Integrations">
            <S.Page>
                {CATEGORIES
                    .filter(cat => categoryEnabled(cat.key) || settings.promote_disabled_features)
                    .map(cat => {
                        const enabled = categoryEnabled(cat.key);
                        const providers = getProvidersByCategory(cat.key).filter(providerCfg =>
                            (providerCfg.provider !== 'mailbox' || settings.mailbox_enabled)
                            && (providerCfg.provider !== 'mailbox' || !managedMailboxEnabled)
                        );
                        if (providers.length === 0) return null;

                        return (
                            <CategorySection key={cat.key} label={cat.label} icon={cat.icon} description={cat.description}>
                                {providers.map(providerCfg => (
                                    <ProviderCard
                                        key={providerCfg.provider}
                                        providerConfig={providerCfg}
                                        integrations={integrations.filter(i => i.provider === providerCfg.provider)}
                                        currentUserId={currentUserId}
                                        isAdmin={isWorkspaceAdmin}
                                        onConnect={setCreateProvider}
                                        onManage={openManageIntegration}
                                        onDelete={handleDelete}
                                        deletingId={deletingId}
                                        disabled={!enabled || providerCfg.comingSoon}
                                        disabledMessage={!enabled ? settings.disabled_feature_message : undefined}
                                    />
                                ))}
                            </CategorySection>
                        );
                    })}
            </S.Page>

            {createProvider && (
                createProvider.mailboxFlow ? (
                    <MailboxDomainModal
                        mode="create"
                        teams={teams}
                        onClose={() => setCreateProvider(null)}
                    />
                ) : (
                    <IntegrationFormModal
                        mode="create"
                        providerConfig={createProvider}
                        teams={teams}
                        onClose={() => setCreateProvider(null)}
                    />
                )
            )}

            {manageIntegration && (
                manageIntegration.provider === 'mailbox' ? (
                    <MailboxDomainModal
                        mode="edit"
                        integration={manageIntegration}
                        teams={teams}
                        onClose={closeManageIntegration}
                        onDelete={handleDelete}
                        isAdmin={isWorkspaceAdmin}
                        deletingId={deletingId}
                    />
                ) : (
                    <IntegrationFormModal
                        mode="edit"
                        integration={manageIntegration}
                        teams={teams}
                        onClose={closeManageIntegration}
                        onDelete={handleDelete}
                        isAdmin={isWorkspaceAdmin}
                        deletingId={deletingId}
                    />
                )
            )}

            <ConfirmModal />

            {installIntegration && (() => {
                const pc = getProviderConfig(installIntegration.provider);
                const providerLabel = pc?.label ?? installIntegration.provider;
                return (
                    <Modal
                        isOpen
                        onClose={() => setInstallIntegration(null)}
                        title={`${providerLabel} App Created`}
                        width="420px"
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <p style={{ margin: 0, lineHeight: 1.5 }}>
                                <strong>{installIntegration.name}</strong> has been created.
                                Install it on your repositories to start syncing.
                            </p>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <Button size="sm" variant="secondary" onClick={() => setInstallIntegration(null)}>
                                    Later
                                </Button>
                                {installIntegration.provider_external_url && (
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            window.open(installIntegration.provider_external_url!, '_blank');
                                            setInstallIntegration(null);
                                        }}
                                    >
                                        {pc?.icon && <Icon icon={pc.icon} width={14} />}
                                        Install
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Modal>
                );
            })()}
        </AppLayout>
    );
}
