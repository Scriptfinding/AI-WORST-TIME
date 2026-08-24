import React, { useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import type { PageProps } from '@/App/types';
import type { UserWithRelations } from '@/Domains/Admin/Pages/Users/Users';
import type { UserFormData, WorkspaceOption } from '@/Domains/Admin/Pages/Users/UserModals/types';
import { emptyUserForm, toggleWorkspaceId } from '@/Domains/Admin/Pages/Users/UserModals/utils';
import WorkspacePicker from '@/Domains/Admin/Pages/Users/UserModals/WorkspacePicker/WorkspacePicker';
import * as S from './styled';

interface Props {
    user: UserWithRelations | null;
    onClose: () => void;
    workspaces: WorkspaceOption[];
}

export default function EditUserModal({ user, onClose, workspaces }: Props) {
    const { auth } = usePage<PageProps>().props;
    const form = useForm<UserFormData>(emptyUserForm());

    useEffect(() => {
        if (user) {
            form.setData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
                can_create_workspace: user.can_create_workspace,
                workspace_ids: user.workspaces?.map(workspace => workspace.id) ?? [],
            });
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!user) return;
        form.put(`/admin/users/${user.id}`, { onSuccess: onClose });
    };
    const isAdmin = form.data.role === 'admin';
    const isCurrentUser = user?.id === auth.user?.id;

    return (
        <Modal
            isOpen={!!user}
            onClose={onClose}
            title={`Edit ${user?.name ?? 'User'}`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={form.processing}>Save Changes</Button>
                </>
            }
        >
            <S.Form onSubmit={handleSubmit}>
                <S.Section>
                    <S.SectionTitle>Profile</S.SectionTitle>
                    <Input
                        label="Name"
                        value={form.data.name}
                        onChange={event => form.setData('name', event.target.value)}
                        error={form.errors.name}
                    />
                </S.Section>
                <S.Section>
                    <Input
                        label="Email"
                        type="email"
                        value={form.data.email}
                        onChange={event => form.setData('email', event.target.value)}
                        error={form.errors.email}
                    />
                </S.Section>
                <S.Section>
                    <S.SectionTitle>Role</S.SectionTitle>
                    <S.ToggleRow>
                        <S.ToggleLabel>
                            <S.ToggleLabelText>Super Admin</S.ToggleLabelText>
                            <S.ToggleHint>Full access to all workspaces and admin settings</S.ToggleHint>
                        </S.ToggleLabel>
                        <S.Toggle
                            $active={isAdmin}
                            onClick={() => form.setData('role', isAdmin ? 'member' : 'admin')}
                            type="button"
                            disabled={isCurrentUser}
                        >
                            <S.ToggleKnob $active={isAdmin} />
                        </S.Toggle>
                    </S.ToggleRow>
                    {isCurrentUser && <S.OwnRoleHint>You cannot remove your own admin role</S.OwnRoleHint>}
                    <S.ToggleRow>
                        <S.ToggleLabel>
                            <S.ToggleLabelText>Can create workspaces</S.ToggleLabelText>
                            <S.ToggleHint>Allow this user to create new workspaces</S.ToggleHint>
                        </S.ToggleLabel>
                        <S.Toggle
                            $active={form.data.can_create_workspace}
                            onClick={() => form.setData('can_create_workspace', !form.data.can_create_workspace)}
                            type="button"
                        >
                            <S.ToggleKnob $active={form.data.can_create_workspace} />
                        </S.Toggle>
                    </S.ToggleRow>
                </S.Section>
                <S.Section>
                    <S.SectionTitle>Workspaces</S.SectionTitle>
                    <WorkspacePicker
                        workspaces={workspaces}
                        selectedIds={form.data.workspace_ids}
                        onToggle={id => form.setData(
                            'workspace_ids',
                            toggleWorkspaceId(form.data.workspace_ids, id),
                        )}
                    />
                </S.Section>
                <S.Section>
                    <S.SectionTitle>Security</S.SectionTitle>
                    <Input
                        label="New password"
                        type="password"
                        value={form.data.password}
                        onChange={event => form.setData('password', event.target.value)}
                        error={form.errors.password}
                        placeholder="Leave empty to keep current"
                    />
                </S.Section>
            </S.Form>
        </Modal>
    );
}
