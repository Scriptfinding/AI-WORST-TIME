import { useState } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/Shared/UI/Modal/Modal';
import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import type { Folder } from '@/Domains/Folder/types';
import * as S from './styled';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentFolder: Folder | null;
    isWorkspaceView?: boolean;
    ownerId?: Id | null;
}

export default function CreateFolderModal({ isOpen, onClose, currentFolder, isWorkspaceView, ownerId = null }: Props) {
    const [newFolderName, setNewFolderName] = useState('');

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        router.post('/folders', {
            name: newFolderName,
            parent_id: currentFolder?.id || null,
            ...(isWorkspaceView && { is_shared: true }),
            ...(!isWorkspaceView && ownerId && { owner_id: ownerId }),
        }, {
            onSuccess: () => {
                onClose();
                setNewFolderName('');
            },
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="New Folder"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleCreateFolder}>Create</Button>
                </>
            }
        >
            <S.Body>
                <Input
                    label="Folder name"
                    value={newFolderName}
                    onChange={event => setNewFolderName(event.target.value)}
                    placeholder="My folder"
                    autoFocus
                    onKeyDown={event => event.key === 'Enter' && handleCreateFolder()}
                />
            </S.Body>
        </Modal>
    );
}
