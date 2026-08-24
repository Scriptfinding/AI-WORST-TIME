import { useState } from 'react';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { Integration } from '@/Domains/Integration/types';
import type { MailboxDomainModalProps } from './types';
import useMailboxDnsSetup from './useMailboxDnsSetup';
import useMailboxDomains from './useMailboxDomains';
import useMailboxIntegrationForm from './useMailboxIntegrationForm';
import useMailboxModalNavigation from './useMailboxModalNavigation';

// Composes form, domain, DNS, and navigation controllers for MailboxDomainModal.
export default function useMailboxDomainModal(props: MailboxDomainModalProps) {
    const { confirm, ConfirmModal } = useConfirm();
    const isReadonly = props.mode === 'edit' ? props.integration.is_readonly : false;
    const [createdIntegration, setCreatedIntegration] = useState<Integration | null>(null);
    const [createdDomainId, setCreatedDomainId] = useState<number | null>(null);
    const navigation = useMailboxModalNavigation({
        mode: props.mode,
        onClose: props.onClose,
        editIntegrationId: props.mode === 'edit' ? props.integration.id : null,
    });
    const dns = useMailboxDnsSetup({
        integrationId: navigation.integrationId,
        isReadonly,
        onOpen: navigation.showDomainSetup,
        onVerified: domain => {
            if (props.mode === 'edit') {
                props.onVerified?.({ integration: props.integration, domain });
                return;
            }
            if (props.mode === 'create' && createdIntegration && domain.id === createdDomainId) {
                props.onVerified?.({ integration: createdIntegration, domain });
            }
        },
    });
    const integration = useMailboxIntegrationForm({
        props,
        isReadonly,
        confirm,
        handleClose: navigation.handleClose,
        setCreatedIntegrationId: navigation.setCreatedIntegrationId,
        onCreated: (domain, created) => {
            setCreatedIntegration(created);
            setCreatedDomainId(domain.id);
            dns.openDomainSetup(domain, created.id);
        },
    });
    const domains = useMailboxDomains({
        integrationId: navigation.integrationId,
        isReadonly: integration.isReadonly,
        initiallyLoading: props.mode === 'edit',
        loadEnabled: navigation.view === 'domain-list',
        confirm,
        onOpenDomain: dns.openDomainSetup,
    });

    return {
        view: navigation.view,
        integrationName: integration.integrationName,
        domainName: integration.domainName,
        createScope: integration.createScope,
        createTeamId: integration.createTeamId,
        submitting: integration.submitting,
        error: integration.error,
        createdIntegrationId: navigation.createdIntegrationId,
        editName: integration.editName,
        editScope: integration.editScope,
        editTeamId: integration.editTeamId,
        editOwnerId: integration.editOwnerId,
        savingName: integration.savingName,
        domains: domains.domains,
        loadingDomains: domains.loadingDomains,
        addDomainName: domains.addDomainName,
        addingDomain: domains.addingDomain,
        addDomainError: domains.addDomainError,
        activeDomain: dns.activeDomain,
        dnsRecords: dns.dnsRecords,
        activeTab: dns.activeTab,
        copied: dns.copied,
        checking: dns.checking,
        dnsResult: dns.dnsResult,
        publicIp: dns.publicIp,
        isReadonly: integration.isReadonly,
        ownershipDisabled: integration.ownershipDisabled,
        canSave: integration.canSave,
        ConfirmModal,
        handleClose: navigation.handleClose,
        handleSaveName: integration.handleSaveName,
        handleCreate: integration.handleCreate,
        handleAddDomain: domains.handleAddDomain,
        handleDeleteDomain: domains.handleDeleteDomain,
        handleCopy: dns.handleCopy,
        handleCheckDns: dns.handleCheckDns,
        openDomainSetup: dns.openDomainSetup,
        setIntegrationName: integration.setIntegrationName,
        setDomainName: integration.setDomainName,
        setError: integration.setError,
        setCreateScope: integration.setCreateScope,
        setCreateTeamId: integration.setCreateTeamId,
        setEditName: integration.setEditName,
        setEditScope: integration.setEditScope,
        setEditTeamId: integration.setEditTeamId,
        setEditOwnerId: integration.setEditOwnerId,
        setTargetUserRole: integration.setTargetUserRole,
        setAddDomainName: domains.setAddDomainName,
        setAddDomainError: domains.setAddDomainError,
        setActiveTab: dns.setActiveTab,
        backToDomainList: () => {
            navigation.showDomainList();
            dns.clearActiveDomain();
        },
    };
}
