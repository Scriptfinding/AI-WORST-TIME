import type { ReactNode } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import type { FlowRun } from '@/Domains/Flow/types';
import * as S from './styled';

interface RunActionsProps {
    run: FlowRun;
    isActive: boolean;
    isFinished: boolean;
    onKill?: (run: FlowRun) => void;
    onRerun?: (run: FlowRun) => void;
    onDelete: () => void;
    footerExtra?: ReactNode;
}

export default function RunActions({
    run,
    isActive,
    isFinished,
    onKill,
    onRerun,
    onDelete,
    footerExtra,
}: RunActionsProps) {
    return (
        <S.FooterActions>
            {isActive && onKill && (
                <Button size="sm" variant="danger" onClick={() => onKill(run)}>
                    <Icon icon="lucide:ban" width={14} height={14} />
                    Stop
                </Button>
            )}
            {isFinished && (
                <Button size="sm" variant="ghost" onClick={onDelete}>
                    <Icon icon="lucide:trash-2" width={14} height={14} />
                    Delete
                </Button>
            )}
            {onRerun && (
                <Button size="sm" onClick={() => onRerun(run)}>
                    Run again
                    <Icon icon="lucide:refresh-cw" width={14} height={14} />
                </Button>
            )}
            {footerExtra}
        </S.FooterActions>
    );
}
