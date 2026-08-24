import type React from 'react';
import CreateMailboxModal from '@/Domains/Mailbox/Pages/CreateMailboxModal/CreateMailboxModal';
import EditMailboxModal from '@/Domains/Mailbox/Pages/EditMailboxModal/EditMailboxModal';
import type { MailboxesPageProps } from '@/Domains/Mailbox/Pages/Mailboxes/types';
import type { useMailboxModals } from '@/Domains/Mailbox/Pages/Mailboxes/useMailboxModals';
import * as S from './styled';

interface Props {
    domains: MailboxesPageProps['domains'];
    teams: MailboxesPageProps['teams'];
    groups: string[];
    modals: ReturnType<typeof useMailboxModals>;
    ConfirmModal: React.ComponentType;
}

export default function MailboxModals({
    domains,
    teams,
    groups,
    modals,
    ConfirmModal,
}: Props) {
    return (
        <S.ModalMounts>
            <CreateMailboxModal
                isOpen={modals.showCreate}
                onClose={modals.closeCreate}
                domains={domains}
                teams={teams}
                groups={groups}
            />

            {modals.editMailbox && (
                <EditMailboxModal
                    mailbox={modals.editMailbox}
                    onClose={modals.closeEdit}
                    teams={teams}
                    groups={groups}
                />
            )}

            <ConfirmModal />
        </S.ModalMounts>
    );
}
