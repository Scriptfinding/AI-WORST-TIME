import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import * as S from './styled';

interface Props {
    workspaceName: string;
}

export default function DeleteWorkspace({ workspaceName }: Props) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmValue, setDeleteConfirmValue] = useState('');
    const canDelete = deleteConfirmValue === workspaceName;

    const openDeleteModal = () => {
        setDeleteConfirmValue('');
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (!canDelete) return;
        router.delete('/workspace');
    };

    return (
        <>
            <S.DangerCard>
                <S.DangerTitle>
                    <Icon icon="lucide:triangle-alert" width={14} height={14} />
                    Danger Zone
                </S.DangerTitle>
                <S.DangerDescription>
                    Permanently delete this workspace and all its flows, run history, folders, webhooks and artifacts. This action cannot be undone.
                </S.DangerDescription>
                <Button variant="danger" size="sm" onClick={openDeleteModal}>
                    <Icon icon="lucide:trash-2" width={13} height={13} />
                    Delete Workspace
                </Button>
            </S.DangerCard>

            {showDeleteModal && (
                <S.DeleteOverlay onClick={() => setShowDeleteModal(false)}>
                    <S.DeleteDialog onClick={event => event.stopPropagation()}>
                        <S.DeleteIconCircle>
                            <Icon icon="lucide:trash-2" width={28} height={28} />
                        </S.DeleteIconCircle>

                        <S.DeleteTitle>Delete Workspace</S.DeleteTitle>

                        <S.DeleteMessage>
                            This will permanently delete <strong>{workspaceName}</strong> and all its flows, runs, folders, webhooks and artifacts. This action cannot be undone.
                        </S.DeleteMessage>

                        <S.DeleteInputLabel>
                            Type <strong>{workspaceName}</strong> to confirm
                        </S.DeleteInputLabel>
                        <Input
                            value={deleteConfirmValue}
                            onChange={event => setDeleteConfirmValue(event.target.value)}
                            placeholder={workspaceName}
                            autoFocus
                        />

                        <S.DeleteActions>
                            <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="danger" size="sm" disabled={!canDelete} onClick={handleDelete}>
                                <Icon icon="lucide:trash-2" width={13} height={13} />
                                Delete Workspace
                            </Button>
                        </S.DeleteActions>
                    </S.DeleteDialog>
                </S.DeleteOverlay>
            )}
        </>
    );
}
