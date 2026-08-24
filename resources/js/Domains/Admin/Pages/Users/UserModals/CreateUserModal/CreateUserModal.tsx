import React from 'react';
import { useForm } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import type { UserFormData, WorkspaceOption } from '@/Domains/Admin/Pages/Users/UserModals/types';
import { emptyUserForm, toggleWorkspaceId } from '@/Domains/Admin/Pages/Users/UserModals/utils';
import WorkspacePicker from '@/Domains/Admin/Pages/Users/UserModals/WorkspacePicker/WorkspacePicker';
import * as S from './styled';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    workspaces: WorkspaceOption[];
}

export default function CreateUserModal({ isOpen, onClose, workspaces }: Props) {
    const form = useForm<UserFormData>(emptyUserForm());
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/admin/users', {
            onSuccess: () => {
                onClose();
                form.reset();
            },
        });
    };
    const isAdmin = form.data.role === 'admin';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add User"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={form.processing}>Create</Button>
                </>
            }
        >
            <S.Form onSubmit={handleSubmit}>
                <Input
                    label="Name"
                    value={form.data.name}
                    onChange={event => form.setData('name', event.target.value)}
                    error={form.errors.name}
                    autoFocus
                />
                <Input
                    label="Email"
                    type="email"
                    value={form.data.email}
                    onChange={event => form.setData('email', event.target.value)}
                    error={form.errors.email}
                />
                <Input
                    label="Password"
                    type="password"
                    value={form.data.password}
                    onChange={event => form.setData('password', event.target.value)}
                    error={form.errors.password}
                />
                <S.ToggleRow>
                    <S.ToggleLabel>
                        <S.ToggleLabelText>Super Admin</S.ToggleLabelText>
                        <S.ToggleHint>Full access to all workspaces and admin settings</S.ToggleHint>
                    </S.ToggleLabel>
                    <S.Toggle
                        $active={isAdmin}
                        onClick={() => form.setData('role', isAdmin ? 'member' : 'admin')}
                        type="button"
                    >
                        <S.ToggleKnob $active={isAdmin} />
                    </S.Toggle>
                </S.ToggleRow>
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
                <div>
                    <S.FieldLabel>Assign to workspaces</S.FieldLabel>
                    <WorkspacePicker
                        workspaces={workspaces}
                        selectedIds={form.data.workspace_ids}
                        onToggle={id => form.setData(
                            'workspace_ids',
                            toggleWorkspaceId(form.data.workspace_ids, id),
                        )}
                    />
                </div>
            </S.Form>
        </Modal>
    );
}
