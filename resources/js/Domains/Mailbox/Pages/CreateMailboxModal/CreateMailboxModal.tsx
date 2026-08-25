import type React from 'react';
import Modal from '@/Shared/UI/Modal/Modal';
import Button from '@/Shared/UI/Button/Button';
import type { ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import type { CreatedMailbox, MailboxDomain } from '@/Domains/Mailbox/types';
import IntegrationDomainSelection from './components/IntegrationDomainSelection/IntegrationDomainSelection';
import MailboxIdentityOptions from './components/MailboxIdentityOptions/MailboxIdentityOptions';
import ScopeOwnership from './components/ScopeOwnership/ScopeOwnership';
import useCreateMailboxForm from './hooks/useCreateMailboxForm';
import * as S from './styled';

export interface CreateMailboxModalProps {
    isOpen: boolean;
    onClose: () => void;
    domains: Pick<MailboxDomain, 'id' | 'name'>[];
    teams: ScopeTeam[];
    groups?: string[];
    onCreated?: (mailbox: CreatedMailbox) => void;
    zIndex?: number;
    quickMode?: boolean;
}

export default function CreateMailboxModal({
    isOpen,
    onClose,
    domains,
    teams,
    groups = [],
    onCreated,
    zIndex,
    quickMode,
}: CreateMailboxModalProps) {
    const form = useCreateMailboxForm({ isOpen, onClose, domains, onCreated });
    const { ConfirmModal } = form;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await form.submit();
    };

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Mailbox"
            width="560px"
            zIndex={zIndex}
            modalKind={quickMode ? 'mailbox-quick-create' : undefined}
        >
            <S.ModalForm onSubmit={handleSubmit}>
                <IntegrationDomainSelection
                    domains={domains}
                    value={form.domainId}
                    onChange={form.setDomainId}
                />
                {domains.length > 0 && (
                    <>
                        <MailboxIdentityOptions
                            slug={form.slug}
                            domainName={form.selectedDomain?.name}
                            description={form.description}
                            group={form.group}
                            groups={groups}
                            error={form.error}
                            onSlugChange={form.changeSlug}
                            onDescriptionChange={form.setDescription}
                            onGroupChange={form.setGroup}
                        />
                        <ScopeOwnership
                            scope={form.scope}
                            teamId={form.teamId}
                            ownerId={form.ownerId}
                            teams={teams}
                            onScopeChange={form.changeScope}
                            onOwnerChange={form.setOwnerId}
                        />
                        <S.ModalActions>
                            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
                            <Button
                                type="submit"
                                size="sm"
                                loading={form.submitting}
                                disabled={!form.slug.trim() || !form.domainId}
                            >
                                Create Mailbox
                            </Button>
                        </S.ModalActions>
                    </>
                )}
            </S.ModalForm>
        </Modal>
        <ConfirmModal />
        </>
    );
}
