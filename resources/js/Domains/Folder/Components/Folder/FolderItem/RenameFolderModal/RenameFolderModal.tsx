import { useState } from 'react';
import { router } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import type { Folder } from '@/Domains/Folder/types';

interface Props {
    folder: Folder;
    onClose: () => void;
}

export default function RenameFolderModal({ folder, onClose }: Props) {
    const [name, setName] = useState(folder.name);
    const [renaming, setRenaming] = useState(false);

    const close = () => {
        if (!renaming) onClose();
    };

    const rename = () => {
        if (!name.trim() || name === folder.name) {
            onClose();
            return;
        }

        setRenaming(true);
        router.put(`/folders/${folder.id}`, { name }, {
            onSuccess: () => {
                onClose();
                setRenaming(false);
            },
            onError: () => setRenaming(false),
        });
    };

    return (
        <Modal
            isOpen
            onClose={close}
            title="Rename Folder"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={renaming}>Cancel</Button>
                    <Button onClick={rename} loading={renaming}>Rename</Button>
                </>
            }
        >
            <Input
                label="Folder name"
                value={name}
                onChange={event => setName(event.target.value)}
                autoFocus
                onKeyDown={event => event.key === 'Enter' && rename()}
            />
        </Modal>
    );
}
