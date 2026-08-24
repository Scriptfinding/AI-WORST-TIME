import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import * as S from './styled';

interface SaveBeforeRunModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveAndRun: () => void;
    onRunWithoutSaving: () => void;
}

export default function SaveBeforeRunModal({ isOpen, onClose, onSaveAndRun, onRunWithoutSaving }: SaveBeforeRunModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Unsaved Changes"
            width="480px"
            footer={
                <S.SaveBeforeRunActions>
                    <Button variant="secondary" size="sm" onClick={onRunWithoutSaving}>
                        <Icon icon="lucide:play" width={14} height={14} />
                        Run without saving
                    </Button>
                    <Button size="sm" onClick={onSaveAndRun}>
                        <Icon icon="lucide:save" width={14} height={14} />
                        Save & Run
                    </Button>
                </S.SaveBeforeRunActions>
            }
        >
            <S.SaveBeforeRunMessage>
                <S.SaveBeforeRunIcon>
                    <Icon icon="lucide:alert-triangle" width={32} height={32} />
                </S.SaveBeforeRunIcon>
                <S.SaveBeforeRunText>
                    You have unsaved changes in your flow. Would you like to save before running?
                </S.SaveBeforeRunText>
                <S.SaveBeforeRunHint>
                    Running without saving will use the current editor state but won't persist it.
                </S.SaveBeforeRunHint>
            </S.SaveBeforeRunMessage>
        </Modal>
    );
}
