import { useLayoutEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import type { WorkspaceUser } from '@/Domains/Workspace/types';
import * as Shared from '@/Domains/Workspace/Pages/WorkspaceMembers/shared.styled';
import * as S from './styled';

interface Props {
    user: WorkspaceUser | null;
    callerWorkspaceRole: 'admin' | 'manager' | 'member';
    workspaceSharingEnabled: boolean;
    onClose: () => void;
}

export default function EditMemberModal({ user, callerWorkspaceRole, workspaceSharingEnabled, onClose }: Props) {
    const form = useForm({
        role: 'member' as string,
        can_create_workspace: true,
    });
    const { setData } = form;

    useLayoutEffect(() => {
        if (!user) return;
        setData({
            role: workspaceSharingEnabled ? user.pivot.role : 'member',
            can_create_workspace: user.can_create_workspace ?? true,
        });
    }, [setData, user, workspaceSharingEnabled]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!user) return;
        form.put(`/workspace/members/${user.id}`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <Modal
            isOpen={!!user}
            onClose={onClose}
            title={`Edit ${user?.name ?? 'Member'}`}
            footer={
                <>
                    <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
                    <Button size="sm" onClick={handleSubmit} disabled={form.processing}>Save</Button>
                </>
            }
        >
            <S.Form onSubmit={handleSubmit}>
                {workspaceSharingEnabled && (
                    <Shared.SelectWrapper>
                        <Shared.Label>Role</Shared.Label>
                        <Shared.Select value={form.data.role} onChange={event => form.setData('role', event.target.value)}>
                            <option value="member">Member</option>
                            <option value="manager">Manager</option>
                            {callerWorkspaceRole === 'admin' && <option value="admin">Admin</option>}
                        </Shared.Select>
                    </Shared.SelectWrapper>
                )}
                {form.errors.role && <Shared.ErrorText>{form.errors.role}</Shared.ErrorText>}
                <Shared.CheckboxRow>
                    <input
                        type="checkbox"
                        id="edit-can-create-workspace"
                        checked={form.data.can_create_workspace}
                        onChange={event => form.setData('can_create_workspace', event.target.checked)}
                    />
                    <label htmlFor="edit-can-create-workspace">Can create workspaces</label>
                </Shared.CheckboxRow>
            </S.Form>
        </Modal>
    );
}
