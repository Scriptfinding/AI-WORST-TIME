import Modal from '@/Shared/UI/Modal/Modal';
import Button from '@/Shared/UI/Button/Button';
import type { PendingMove } from '@/Domains/Flow/Pages/FlowExplorer/ExplorerContent/types';
import { scopeLabel } from '@/Domains/Flow/Pages/FlowExplorer/ExplorerContent/utils';
import * as S from './styled';

interface Props {
    pendingMove: PendingMove | null;
    onClose: () => void;
    onConfirm: (move: PendingMove) => void;
}

export default function VisibilityMoveModal({ pendingMove, onClose, onConfirm }: Props) {
    return (
        <Modal
            isOpen={Boolean(pendingMove)}
            onClose={onClose}
            title="Change visibility?"
            width="420px"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => pendingMove && onConfirm(pendingMove)}>
                        Move &amp; change visibility
                    </Button>
                </>
            }
        >
            {pendingMove && (
                <S.Warning>
                    This flow is currently <strong>{scopeLabel(pendingMove.fromScope)}</strong> and you are moving it to a <strong>{scopeLabel(pendingMove.target.scope)}</strong> folder.
                    <br /><br />
                    Its visibility must be changed to <strong>{scopeLabel(pendingMove.target.scope)}</strong> to keep it accessible in the destination folder.
                </S.Warning>
            )}
        </Modal>
    );
}
