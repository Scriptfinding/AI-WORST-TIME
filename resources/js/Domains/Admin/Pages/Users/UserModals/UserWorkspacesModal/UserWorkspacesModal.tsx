import React from 'react';
import Badge from '@/Shared/UI/Badge/Badge';
import Modal from '@/Shared/UI/Modal/Modal';
import WorkspaceIcon from '@/Domains/Workspace/Components/WorkspaceIcon/WorkspaceIcon';
import { ucfirst } from '@/Shared/Utils/string';
import type { UserWithRelations } from '@/Domains/Admin/Pages/Users/Users';
import * as Shared from '@/Domains/Admin/Pages/Users/UserModals/shared.styled';
import * as S from './styled';

interface Props {
    user: UserWithRelations | null;
    onClose: () => void;
}

export default function UserWorkspacesModal({ user, onClose }: Props) {
    return (
        <Modal isOpen={!!user} onClose={onClose} title={`Workspaces - ${user?.name ?? ''}`}>
            <Shared.ModalList>
                {user?.workspaces.map(workspace => (
                    <S.Item key={workspace.id}>
                        <Shared.ModalItemLabel>
                            <WorkspaceIcon workspace={workspace} size={18} />
                            <Shared.ModalItemName>{workspace.name}</Shared.ModalItemName>
                        </Shared.ModalItemLabel>
                        <Badge variant={workspace.pivot.role === 'admin' ? 'info' : workspace.pivot.role === 'manager' ? 'warning' : 'success'}>
                            {ucfirst(workspace.pivot.role)}
                        </Badge>
                    </S.Item>
                ))}
                {user?.workspaces.length === 0 && <Shared.ModalEmptyState>No workspaces</Shared.ModalEmptyState>}
            </Shared.ModalList>
        </Modal>
    );
}
