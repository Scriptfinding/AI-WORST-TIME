import { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import Modal from '@/Shared/UI/Modal/Modal';
import Button from '@/Shared/UI/Button/Button';
import type { DeletableFolder, FolderTree } from '@/Domains/Folder/types';
import { countFlowsInTree, countSubFolders, findFolderInTree } from '@/Domains/Flow/Pages/FlowExplorer/ExplorerModals/utils';
import * as S from './styled';

interface Props {
    folder: DeletableFolder | null;
    folderTree: FolderTree[];
    onClose: () => void;
}

export default function DeleteFolderModal({ folder, folderTree, onClose }: Props) {
    const [deleting, setDeleting] = useState(false);
    const treeNode = folder ? findFolderInTree(folderTree, folder.id) : null;
    const flowsCount = treeNode ? countFlowsInTree(treeNode) : 0;
    const subFoldersCount = treeNode ? countSubFolders(treeNode) : 0;

    const handleDeleteFolder = () => {
        if (!folder) return;
        setDeleting(true);
        router.delete(`/folders/${folder.id}`, {
            onSuccess: () => {
                onClose();
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    return (
        <Modal
            isOpen={!!folder}
            onClose={() => !deleting && onClose()}
            title="Delete Folder"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDeleteFolder} loading={deleting}>
                        <Icon icon="lucide:trash-2" width={14} height={14} />
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </>
            }
        >
            <S.Body>
                <S.Icon>
                    <Icon icon="lucide:trash-2" width={28} height={28} />
                </S.Icon>
                <S.Title>
                    Delete &ldquo;{folder?.name}&rdquo;?
                </S.Title>
                {flowsCount > 0 || subFoldersCount > 0 ? (
                    <>
                        <S.Text>
                            This folder contains{' '}
                            {flowsCount > 0 && (
                                <strong>{flowsCount} flow{flowsCount > 1 ? 's' : ''}</strong>
                            )}
                            {flowsCount > 0 && subFoldersCount > 0 && ' and '}
                            {subFoldersCount > 0 && (
                                <strong>{subFoldersCount} sub-folder{subFoldersCount > 1 ? 's' : ''}</strong>
                            )}
                            . Everything inside will be permanently deleted.
                        </S.Text>
                        <S.Warning>
                            <Icon icon="lucide:alert-triangle" width={16} height={16} />
                            <span>All flows, their run history, recordings, screenshots and downloads will be lost. This action cannot be undone.</span>
                        </S.Warning>
                    </>
                ) : (
                    <S.Text>
                        This empty folder will be permanently deleted. This action cannot be undone.
                    </S.Text>
                )}
            </S.Body>
        </Modal>
    );
}
