import { useState } from 'react';
import { router } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import type { WorkspaceWithRelations } from '@/Domains/Admin/Pages/Workspaces/Workspaces';
import * as S from './styled';

interface Props {
    workspace: WorkspaceWithRelations | null;
    onClose: () => void;
}

export default function DeleteWorkspaceModal({ workspace, onClose }: Props) {
    const [confirmation, setConfirmation] = useState('');

    const handleClose = () => {
        onClose();
        setConfirmation('');
    };

    const handleDelete = () => {
        if (!workspace || confirmation !== workspace.name) return;

        router.delete(`/admin/workspaces/${workspace.id}`, {
            onSuccess: handleClose,
        });
    };

    return (
        <Modal
            isOpen={workspace !== null}
            onClose={handleClose}
            title="Delete Workspace"
            footer={
                <>
                    <Button variant="secondary" size="sm" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        disabled={!workspace || confirmation !== workspace.name}
                        onClick={handleDelete}
                    >
                        Delete Workspace
                    </Button>
                </>
            }
        >
            <S.ConfirmHint>
                This will permanently delete <strong>{workspace?.name}</strong> and all its flows, runs and artifacts. This action cannot be undone.
            </S.ConfirmHint>
            <S.ConfirmHint>
                Type <strong>{workspace?.name}</strong> to confirm:
            </S.ConfirmHint>
            <S.ConfirmInput
                value={confirmation}
                onChange={event => setConfirmation(event.target.value)}
                placeholder={workspace?.name}
                autoFocus
            />
        </Modal>
    );
}
