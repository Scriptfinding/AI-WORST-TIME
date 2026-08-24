import { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { usePageProps } from '@/App/Hooks/usePageProps';
import { Card, CardTitle } from '@/Domains/Workspace/Pages/WorkspaceMembers/shared.styled';
import type { PendingInvitation } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import InvitationErrorModal from '@/Domains/Workspace/Pages/WorkspaceMembers/InviteCard/InvitationErrorModal/InvitationErrorModal';
import type { WorkspaceRole } from '@/Domains/Workspace/Pages/WorkspaceMembers/InviteCard/types';
import PendingInvitationsTable from './PendingInvitationsTable/PendingInvitationsTable';
import ValidateInvitationModal from './ValidateInvitationModal/ValidateInvitationModal';
import * as S from './styled';

interface Props {
    pendingInvitations: PendingInvitation[];
    callerWorkspaceRole: WorkspaceRole;
}

export default function PendingInvitationsCard({ pendingInvitations, callerWorkspaceRole }: Props) {
    const { settings } = usePageProps();
    const workspaceSharingEnabled = settings?.workspace_sharing_enabled ?? false;
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [validateInvitation, setValidateInvitation] = useState<PendingInvitation | null>(null);
    const { confirm, ConfirmModal } = useConfirm();

    if (pendingInvitations.length === 0) return null;

    const resendInvitation = (invitation: PendingInvitation) => {
        router.post(`/workspace/invitations/${invitation.id}/resend`, {}, {
            preserveScroll: true,
            onError: errors => {
                if (errors.invite_error) setInviteError(errors.invite_error);
            },
        });
    };

    const revokeInvitation = async (invitation: PendingInvitation) => {
        const confirmed = await confirm({
            title: 'Cancel Invitation',
            message: `Cancel invitation for "${invitation.email}"?`,
            confirmLabel: 'Cancel Invitation',
            variant: 'danger',
        });
        if (confirmed) router.delete(`/workspace/invitations/${invitation.id}`);
    };

    return (
        <>
            <Card>
                <CardTitle>
                    <Icon icon="lucide:clock" width={15} height={15} />
                    Pending Invitations
                    <S.CountHint>({pendingInvitations.length})</S.CountHint>
                </CardTitle>

                <PendingInvitationsTable
                    invitations={pendingInvitations}
                    workspaceSharingEnabled={workspaceSharingEnabled}
                    onResend={resendInvitation}
                    onValidate={setValidateInvitation}
                    onRevoke={revokeInvitation}
                />
            </Card>

            <InvitationErrorModal error={inviteError} onClose={() => setInviteError(null)} />
            <ValidateInvitationModal
                invitation={validateInvitation}
                callerWorkspaceRole={callerWorkspaceRole}
                workspaceSharingEnabled={workspaceSharingEnabled}
                onClose={() => setValidateInvitation(null)}
            />
            <ConfirmModal />
        </>
    );
}
