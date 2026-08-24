import React from 'react';
import CreateUserModal from './CreateUserModal/CreateUserModal';
import EditUserModal from './EditUserModal/EditUserModal';
import UserFlowsModal from './UserFlowsModal/UserFlowsModal';
import UserWorkspacesModal from './UserWorkspacesModal/UserWorkspacesModal';
import type { UserModalsProps } from './types';

export default function UserModals({
    showCreate, onCloseCreate,
    editingUser, onCloseEdit,
    wsDetailUser, onCloseWsDetail,
    flowsDetailUser, onCloseFlowsDetail,
    allWorkspaces,
}: UserModalsProps) {
    return (
        <>
            <CreateUserModal isOpen={showCreate} onClose={onCloseCreate} workspaces={allWorkspaces} />
            <EditUserModal user={editingUser} onClose={onCloseEdit} workspaces={allWorkspaces} />
            <UserWorkspacesModal user={wsDetailUser} onClose={onCloseWsDetail} />
            <UserFlowsModal user={flowsDetailUser} onClose={onCloseFlowsDetail} />
        </>
    );
}
