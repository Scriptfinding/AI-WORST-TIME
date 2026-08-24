import React, { useMemo, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import type { PaginatedData } from '@/Shared/Types/pagination';
import type { Workspace } from '@/Domains/Workspace/types';
import WorkspaceTable from './WorkspaceTable/WorkspaceTable';
import WorkspaceModals from './WorkspaceModals/WorkspaceModals';
import * as S from './styled';

export interface WorkspaceWithRelations extends Omit<Workspace, 'users'> {
    users_count: number;
    flows_count: number;
    users: { id: Id; name: string; icon_type: 'emoji' | 'color' | 'upload'; icon_value: string | null; icon_color: string | null; icon_url: string | null; pivot: { role: 'admin' | 'manager' | 'member' } }[];
    flows: { id: Id; name: string; icon_type: string; icon_value: string | null; icon_color: string | null; icon_url: string | null }[];
    created_at: string;
}

interface Props {
    adminWorkspaces: PaginatedData<WorkspaceWithRelations>;
    editingWorkspace: WorkspaceWithRelations | null;
    workspaceLimit: number;
    workspaceCount: number;
}

export default function Workspaces({ adminWorkspaces, editingWorkspace, workspaceLimit, workspaceCount }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<WorkspaceWithRelations | null>(null);
    const [membersTarget, setMembersTarget] = useState<WorkspaceWithRelations | null>(null);
    const [flowsTarget, setFlowsTarget] = useState<WorkspaceWithRelations | null>(null);
    const modalWorkspaces = useMemo(
        () => editingWorkspace && !adminWorkspaces.data.some(workspace => workspace.id === editingWorkspace.id)
            ? [...adminWorkspaces.data, editingWorkspace]
            : adminWorkspaces.data,
        [adminWorkspaces.data, editingWorkspace],
    );
    const {
        selectedItem: editTarget,
        openModal: openEditTarget,
        closeModal: closeEditTarget,
    } = useUrlSyncedModal(modalWorkspaces, 'edit');
    const {
        selectedItem: transferTarget,
        openModal: openTransferTarget,
        closeModal: closeTransferTarget,
    } = useUrlSyncedModal(modalWorkspaces, 'edit-workspace-owner');

    const workspaceLimitReached = workspaceLimit >= 0 && workspaceCount >= workspaceLimit;
    const handleAddWorkspace = () => {
        if (workspaceLimitReached) {
            setShowLimitModal(true);
            return;
        }

        setShowCreate(true);
    };

    return (
        <AppLayout
            title="Workspaces"
            headerRight={
                <Button size="sm" onClick={handleAddWorkspace}>
                    <Icon icon="lucide:plus" width={14} height={14} />
                    Add Workspace
                </Button>
            }
        >
            <S.Page>
                <WorkspaceTable
                    workspaces={adminWorkspaces}
                    workspaceLimit={workspaceLimit}
                    workspaceCount={workspaceCount}
                    onDeleteTarget={setDeleteTarget}
                    onMembersTarget={setMembersTarget}
                    onFlowsTarget={setFlowsTarget}
                    onEditTarget={openEditTarget}
                    onTransferOwnership={openTransferTarget}
                />
            </S.Page>

            <WorkspaceModals
                showCreate={showCreate}
                onCloseCreate={() => setShowCreate(false)}
                deleteTarget={deleteTarget}
                onCloseDelete={() => setDeleteTarget(null)}
                membersTarget={membersTarget}
                onCloseMembers={() => setMembersTarget(null)}
                flowsTarget={flowsTarget}
                onCloseFlows={() => setFlowsTarget(null)}
                editTarget={editTarget}
                onCloseEdit={closeEditTarget}
                transferTarget={transferTarget}
                onCloseTransfer={closeTransferTarget}
            />

            <Modal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                title="Workspace limit reached"
                footer={
                    <Button size="sm" onClick={() => setShowLimitModal(false)}>
                        Got it
                    </Button>
                }
            >
                <S.LimitMessage>
                    This instance already has {workspaceCount} workspace{workspaceCount > 1 ? 's' : ''}, which is the current maximum allowed ({workspaceLimit}).
                    Delete an existing workspace or increase the workspace limit to create another one.
                </S.LimitMessage>
            </Modal>
        </AppLayout>
    );
}
