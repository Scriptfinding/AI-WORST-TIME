import { useLayoutEffect } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useForm } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import {
    ErrorText,
    Label,
    Select,
    SelectWrapper,
} from '@/Domains/Workspace/Pages/WorkspaceMembers/shared.styled';
import type { PendingInvitation } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import type { WorkspaceRole } from '@/Domains/Workspace/Pages/WorkspaceMembers/InviteCard/types';
import * as S from './styled';

interface Props {
    invitation: PendingInvitation | null;
    callerWorkspaceRole: WorkspaceRole;
    workspaceSharingEnabled: boolean;
    onClose: () => void;
}

export default function ValidateInvitationModal({
    invitation,
    callerWorkspaceRole,
    workspaceSharingEnabled,
    onClose,
}: Props) {
    const form = useForm({
        role: 'member' as WorkspaceRole,
    });
    const { setData } = form;

    useLayoutEffect(() => {
        if (!invitation) return;

        setData({
            role: workspaceSharingEnabled ? invitation.role as WorkspaceRole : 'member',
        });
    }, [invitation, setData, workspaceSharingEnabled]);

    const handleValidate = (event: React.FormEvent) => {
        event.preventDefault();
        if (!invitation) return;

        form.post(`/workspace/invitations/${invitation.id}/validate`, {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                form.reset();
            },
        });
    };

    return (
        <Modal
            isOpen={!!invitation}
            onClose={onClose}
            title="Approve Registration"
            footer={
                <S.Footer>
                    <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        size="sm"
                        onClick={handleValidate}
                        loading={form.processing}
                    >
                        <Icon icon="lucide:user-check" width={13} height={13} />
                        Approve
                    </Button>
                </S.Footer>
            }
        >
            <S.Form onSubmit={handleValidate}>
                <S.Info>
                    Approve <strong>{invitation?.registration_name}</strong> ({invitation?.email})
                    and add them to this workspace.
                </S.Info>

                {workspaceSharingEnabled && callerWorkspaceRole !== 'manager' && (
                    <SelectWrapper>
                        <Label>Role</Label>
                        <Select
                            value={form.data.role}
                            onChange={event => form.setData('role', event.target.value as WorkspaceRole)}
                        >
                            <option value="member">Member</option>
                            <option value="manager">Manager</option>
                            {callerWorkspaceRole === 'admin' && <option value="admin">Admin</option>}
                        </Select>
                        {form.errors.role && <ErrorText>{form.errors.role}</ErrorText>}
                    </SelectWrapper>
                )}
            </S.Form>
        </Modal>
    );
}
