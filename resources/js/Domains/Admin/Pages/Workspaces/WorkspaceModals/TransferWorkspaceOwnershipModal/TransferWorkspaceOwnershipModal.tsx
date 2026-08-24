import { useState } from 'react';
import { router } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import type { WorkspaceWithRelations } from '@/Domains/Admin/Pages/Workspaces/Workspaces';
import * as S from './styled';

interface Props {
    workspace: WorkspaceWithRelations | null;
    onClose: () => void;
}

export default function TransferWorkspaceOwnershipModal({ workspace, onClose }: Props) {
    const [selectedOwnerId, setSelectedOwnerId] = useState<Id | null>(null);

    const handleClose = () => {
        onClose();
        setSelectedOwnerId(null);
    };

    const handleTransfer = () => {
        if (!workspace || !selectedOwnerId) return;

        router.put(`/admin/workspaces/${workspace.id}/transfer-ownership`, {
            owner_id: selectedOwnerId,
        }, {
            onSuccess: handleClose,
        });
    };

    return (
        <Modal
            isOpen={workspace !== null}
            onClose={handleClose}
            title={`Transfer Ownership - ${workspace?.name ?? ''}`}
            footer={
                <>
                    <Button variant="secondary" size="sm" onClick={handleClose}>Cancel</Button>
                    <Button
                        size="sm"
                        disabled={!selectedOwnerId || selectedOwnerId === workspace?.owner?.id}
                        onClick={handleTransfer}
                    >
                        Transfer
                    </Button>
                </>
            }
        >
            <S.PickerContainer>
                <UserPicker
                    label="New owner"
                    value={selectedOwnerId}
                    onChange={setSelectedOwnerId}
                    placeholder="Select a user..."
                    fetchUrl="/admin/users-search"
                    clearable={false}
                />
            </S.PickerContainer>
        </Modal>
    );
}
