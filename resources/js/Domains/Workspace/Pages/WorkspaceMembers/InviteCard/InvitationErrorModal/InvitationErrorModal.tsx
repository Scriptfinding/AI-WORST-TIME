import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import * as S from './styled';

interface Props {
    error: string | null;
    onClose: () => void;
}

export default function InvitationErrorModal({ error, onClose }: Props) {
    return (
        <Modal
            isOpen={!!error}
            onClose={onClose}
            title="Invitation Failed"
            footer={<Button size="sm" onClick={onClose}>OK</Button>}
        >
            <S.ErrorDetail>{error}</S.ErrorDetail>
        </Modal>
    );
}
