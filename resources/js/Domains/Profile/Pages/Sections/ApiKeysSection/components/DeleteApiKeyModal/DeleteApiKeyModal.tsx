import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import * as S from './styled';

interface DeleteApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteApiKeyModal({
    isOpen,
    onClose,
    onConfirm,
}: DeleteApiKeyModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Delete API Key"
            width="400px"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="danger" onClick={onConfirm}>
                        <Icon icon="lucide:trash-2" width={14} height={14} />
                        Delete
                    </Button>
                </>
            }
        >
            <S.Warning>
                <S.WarningIcon>
                    <Icon icon="lucide:alert-triangle" width={20} height={20} />
                </S.WarningIcon>
                <S.Message>
                    This action cannot be undone. Any application using this key will lose access immediately.
                </S.Message>
            </S.Warning>
        </Modal>
    );
}
