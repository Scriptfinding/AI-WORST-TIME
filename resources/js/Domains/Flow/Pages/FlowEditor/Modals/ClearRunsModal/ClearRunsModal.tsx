import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import * as S from './styled';

interface ClearRunsModalProps {
    isOpen: boolean;
    totalRuns: number;
    loading: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function ClearRunsModal({ isOpen, totalRuns, loading, onClose, onConfirm }: ClearRunsModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Clear Run History"
            width="480px"
            footer={
                <S.Footer>
                    <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <S.Actions>
                        <Button size="sm" variant="danger" onClick={onConfirm} loading={loading}>
                            <Icon icon="lucide:trash-2" width={14} height={14} />
                            {loading ? 'Clearing...' : 'Clear all'}
                        </Button>
                    </S.Actions>
                </S.Footer>
            }
        >
            <S.Message>
                <S.Icon style={{ color: 'var(--color-error, #ef4444)' }}>
                    <Icon icon="lucide:trash-2" width={32} height={32} />
                </S.Icon>
                <S.Text>
                    Are you sure you want to clear {totalRuns === 1 ? 'this run' : `all ${totalRuns} runs`}?
                </S.Text>
                <S.Hint>
                    This will permanently delete all run history, recordings, screenshots, and downloads for this flow. This action cannot be undone.
                </S.Hint>
            </S.Message>
        </Modal>
    );
}
