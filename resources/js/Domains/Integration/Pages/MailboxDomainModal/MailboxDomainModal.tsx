import Modal from '@/Shared/UI/Modal/Modal';
import DomainListView from './components/DomainListView/DomainListView';
import DomainSetupView from './components/DomainSetupView/DomainSetupView';
import IntegrationForm from './components/IntegrationForm/IntegrationForm';
import type { MailboxDomainModalProps } from './types';
import useMailboxDomainModal from './useMailboxDomainModal';
import { generateZoneFile } from './utils';

export default function MailboxDomainModal(props: MailboxDomainModalProps) {
    const modal = useMailboxDomainModal(props);
    const editProps = props.mode === 'edit' ? props : null;

    if (modal.view === 'form') {
        return (
            <>
                <Modal
                    isOpen
                    onClose={modal.handleClose}
                    title="Connect Mailbox"
                    width="460px"
                    zIndex={props.zIndex}
                    modalKind={props.quickMode ? 'mailbox-domain-quick-create' : undefined}
                >
                    <IntegrationForm
                        integrationName={modal.integrationName}
                        domainName={modal.domainName}
                        scope={modal.createScope}
                        teamId={modal.createTeamId}
                        teams={props.teams}
                        error={modal.error}
                        submitting={modal.submitting}
                        onIntegrationNameChange={value => {
                            modal.setIntegrationName(value);
                            modal.setError('');
                        }}
                        onDomainNameChange={value => {
                            modal.setDomainName(value);
                            modal.setError('');
                        }}
                        onScopeChange={(scope, teamId) => {
                            modal.setCreateScope(scope);
                            modal.setCreateTeamId(teamId);
                        }}
                        onSubmit={modal.handleCreate}
                        onCancel={modal.handleClose}
                    />
                </Modal>
                <modal.ConfirmModal />
            </>
        );
    }

    if (modal.view === 'domain-list') {
        const title = editProps
            ? `Mailbox - ${modal.editName || editProps.integration.name}`
            : 'Mailbox - Domains';

        return (
            <>
                <Modal
                    isOpen
                    onClose={modal.handleClose}
                    title={title}
                    width="520px"
                    zIndex={props.zIndex}
                    modalKind={props.quickMode ? 'mailbox-domain-quick-create' : undefined}
                >
                    <DomainListView
                        mode={props.mode}
                        teams={props.teams}
                        isReadonly={modal.isReadonly}
                        ownershipDisabled={modal.ownershipDisabled}
                        editName={modal.editName}
                        editScope={modal.editScope}
                        editTeamId={modal.editTeamId}
                        editOwnerId={modal.editOwnerId}
                        savingName={modal.savingName}
                        canSave={modal.canSave}
                        domains={modal.domains}
                        loadingDomains={modal.loadingDomains}
                        addDomainName={modal.addDomainName}
                        addingDomain={modal.addingDomain}
                        addDomainError={modal.addDomainError}
                        isAdmin={editProps?.isAdmin ?? false}
                        deletingIntegration={editProps?.deletingId === editProps?.integration.id}
                        onEditNameChange={modal.setEditName}
                        onEditScopeChange={(scope, teamId) => {
                            modal.setEditScope(scope);
                            modal.setEditTeamId(teamId);
                        }}
                        onEditOwnerChange={modal.setEditOwnerId}
                        onOwnerRoleChange={modal.setTargetUserRole}
                        onSave={modal.handleSaveName}
                        onAddDomainNameChange={value => {
                            modal.setAddDomainName(value);
                            modal.setAddDomainError('');
                        }}
                        onAddDomain={modal.handleAddDomain}
                        onOpenDomain={modal.openDomainSetup}
                        onDeleteDomain={modal.handleDeleteDomain}
                        onDeleteIntegration={() => {
                            if (editProps) editProps.onDelete(editProps.integration);
                        }}
                        onClose={modal.handleClose}
                    />
                </Modal>
                <modal.ConfirmModal />
            </>
        );
    }

    if (!modal.activeDomain) return null;
    const setupTitle = props.mode === 'edit'
        ? `DNS Setup - ${modal.activeDomain.name}`
        : `Domain Setup - ${modal.activeDomain.name}`;

    return (
        <>
            <Modal
                isOpen
                onClose={modal.handleClose}
                title={setupTitle}
                width="600px"
                zIndex={props.zIndex}
                modalKind={props.quickMode ? 'mailbox-domain-quick-create' : undefined}
            >
                <DomainSetupView
                    domain={modal.activeDomain}
                    records={modal.dnsRecords}
                    publicIp={modal.publicIp}
                    activeTab={modal.activeTab}
                    zoneFile={generateZoneFile(modal.activeDomain, modal.dnsRecords, modal.publicIp)}
                    copied={modal.copied}
                    checking={modal.checking}
                    result={modal.dnsResult}
                    canGoBack={props.mode === 'edit' || !!modal.createdIntegrationId}
                    isReadonly={modal.isReadonly}
                    onTabChange={modal.setActiveTab}
                    onCopy={modal.handleCopy}
                    onCheckDns={modal.handleCheckDns}
                    onBack={modal.backToDomainList}
                />
            </Modal>
            <modal.ConfirmModal />
        </>
    );
}
