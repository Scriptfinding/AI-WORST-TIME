import { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useForm } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import { usePageProps } from '@/App/Hooks/usePageProps';
import {
    CheckboxRow,
    ErrorText,
    Label,
    Select,
    SelectWrapper,
} from '@/Domains/Workspace/Pages/WorkspaceMembers/shared.styled';
import InvitationErrorModal from '@/Domains/Workspace/Pages/WorkspaceMembers/InviteCard/InvitationErrorModal/InvitationErrorModal';
import type { WorkspaceRole } from '@/Domains/Workspace/Pages/WorkspaceMembers/InviteCard/types';
import type { Team } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import * as S from './styled';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    callerWorkspaceRole: WorkspaceRole;
    teams: Team[];
}

export default function InviteUserModal({ isOpen, onClose, callerWorkspaceRole, teams }: Props) {
    const { settings } = usePageProps();
    const workspaceSharingEnabled = settings?.workspace_sharing_enabled ?? false;
    const [inviteError, setInviteError] = useState<string | null>(null);
    const inviteForm = useForm({
        email: '',
        role: 'member' as WorkspaceRole,
        can_create_workspace: true,
        team_id: '' as string,
    });
    const isTeamManager = callerWorkspaceRole === 'manager';

    const handleInvite = (event: React.FormEvent) => {
        event.preventDefault();
        if (!inviteForm.data.email || (isTeamManager && !inviteForm.data.team_id)) return;

        const url = isTeamManager
            ? `/workspace/teams/${inviteForm.data.team_id}/invitations`
            : '/workspace/members';
        inviteForm.transform(data => isTeamManager
            ? { email: data.email }
            : {
                email: data.email,
                role: data.role,
                can_create_workspace: data.can_create_workspace,
            });
        inviteForm.post(url, {
            preserveScroll: true,
            onSuccess: () => {
                inviteForm.reset();
                onClose();
            },
            onError: errors => {
                if (errors.invite_error) setInviteError(errors.invite_error);
            },
        });
    };

    const handleClose = () => {
        if (inviteForm.processing) return;
        inviteForm.reset();
        inviteForm.clearErrors();
        onClose();
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Invite a Member"
                footer={
                    <S.ModalFooter>
                        <Button size="sm" variant="ghost" onClick={handleClose}>Cancel</Button>
                        <Button
                            size="sm"
                            onClick={handleInvite}
                            loading={inviteForm.processing}
                            disabled={!inviteForm.data.email || (isTeamManager && !inviteForm.data.team_id)}
                        >
                            <Icon icon="lucide:user-plus" width={13} height={13} />
                            {isTeamManager ? 'Invite to Team' : 'Invite to Workspace'}
                        </Button>
                    </S.ModalFooter>
                }
            >
                <S.Form onSubmit={handleInvite}>
                    <SelectWrapper>
                        <Label>Email</Label>
                        <S.TextInput
                            type="email"
                            placeholder="user@example.com"
                            value={inviteForm.data.email}
                            onChange={event => inviteForm.setData('email', event.target.value)}
                            autoFocus
                        />
                        {inviteForm.errors.email && (
                            <ErrorText>{inviteForm.errors.email}</ErrorText>
                        )}
                    </SelectWrapper>

                    {isTeamManager && (
                        <SelectWrapper>
                            <Label>Team</Label>
                            <Select
                                value={inviteForm.data.team_id}
                                onChange={event => inviteForm.setData('team_id', event.target.value)}
                            >
                                <option value="">Select a team</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </Select>
                            {inviteForm.errors.team_id && (
                                <ErrorText>{inviteForm.errors.team_id}</ErrorText>
                            )}
                        </SelectWrapper>
                    )}

                    {workspaceSharingEnabled && !isTeamManager && (
                        <SelectWrapper>
                            <Label>Role</Label>
                            <Select
                                value={inviteForm.data.role}
                                onChange={event => inviteForm.setData('role', event.target.value as WorkspaceRole)}
                            >
                                <option value="member">Member</option>
                                <option value="manager">Manager</option>
                                {callerWorkspaceRole === 'admin' && <option value="admin">Admin</option>}
                            </Select>
                        </SelectWrapper>
                    )}

                    {!isTeamManager && (
                        <CheckboxRow>
                            <input
                                type="checkbox"
                                id="invite-can-create-workspace"
                                checked={inviteForm.data.can_create_workspace}
                                onChange={event => inviteForm.setData('can_create_workspace', event.target.checked)}
                            />
                            <label htmlFor="invite-can-create-workspace">Can create workspaces</label>
                        </CheckboxRow>
                    )}
                </S.Form>
            </Modal>

            <InvitationErrorModal error={inviteError} onClose={() => setInviteError(null)} />
        </>
    );
}
