import React from 'react';
import type { WorkspaceWithRelations } from '@/Domains/Admin/Pages/Workspaces/Workspaces';
import CreateWorkspaceModal from './CreateWorkspaceModal/CreateWorkspaceModal';
import DeleteWorkspaceModal from './DeleteWorkspaceModal/DeleteWorkspaceModal';
import EditWorkspaceModal from './EditWorkspaceModal/EditWorkspaceModal';
import TransferWorkspaceOwnershipModal from './TransferWorkspaceOwnershipModal/TransferWorkspaceOwnershipModal';
import WorkspaceFlowsModal from './WorkspaceFlowsModal/WorkspaceFlowsModal';
import WorkspaceMembersModal from './WorkspaceMembersModal/WorkspaceMembersModal';

interface Props {
    showCreate: boolean;
    onCloseCreate: () => void;
    deleteTarget: WorkspaceWithRelations | null;
    onCloseDelete: () => void;
    membersTarget: WorkspaceWithRelations | null;
    onCloseMembers: () => void;
    flowsTarget: WorkspaceWithRelations | null;
    onCloseFlows: () => void;
    editTarget: WorkspaceWithRelations | null;
    onCloseEdit: () => void;
    transferTarget: WorkspaceWithRelations | null;
    onCloseTransfer: () => void;
}

export default function WorkspaceModals({
    showCreate,
    onCloseCreate,
    deleteTarget,
    onCloseDelete,
    membersTarget,
    onCloseMembers,
    flowsTarget,
    onCloseFlows,
    editTarget,
    onCloseEdit,
    transferTarget,
    onCloseTransfer,
}: Props) {
    return (
        <>
            <WorkspaceMembersModal workspace={membersTarget} onClose={onCloseMembers} />
            <WorkspaceFlowsModal workspace={flowsTarget} onClose={onCloseFlows} />
            {editTarget && (
                <EditWorkspaceModal
                    key={editTarget.id}
                    workspace={editTarget}
                    onClose={onCloseEdit}
                />
            )}
            <DeleteWorkspaceModal workspace={deleteTarget} onClose={onCloseDelete} />
            <CreateWorkspaceModal isOpen={showCreate} onClose={onCloseCreate} />
            <TransferWorkspaceOwnershipModal workspace={transferTarget} onClose={onCloseTransfer} />
        </>
    );
}
