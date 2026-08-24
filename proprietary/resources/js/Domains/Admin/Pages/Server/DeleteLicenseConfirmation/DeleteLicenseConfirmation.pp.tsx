import { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import * as S from './styled.pp';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function DeleteLicenseConfirmation({ isOpen, onClose }: Props) {
    const [deleting, setDeleting] = useState(false);

    const close = () => {
        if (!deleting) onClose();
    };

    const handleDelete = () => {
        router.delete('/admin/server/license', {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onFinish: () => {
                setDeleting(false);
                onClose();
            },
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={close}
            title="Delete License"
            width="440px"
            footer={
                <>
                    <Button variant="secondary" size="sm" onClick={onClose} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
                        <Icon icon="lucide:trash-2" width={14} height={14} />
                        Delete license
                    </Button>
                </>
            }
        >
            <S.Warning>
                <Icon icon="lucide:triangle-alert" width={20} height={20} />
                <span>
                    Remove the license from this instance? Puppetflow will be locked
                    until a new license is activated.
                </span>
            </S.Warning>
        </Modal>
    );
}
