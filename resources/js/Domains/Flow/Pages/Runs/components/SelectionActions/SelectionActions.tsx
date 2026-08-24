import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import type { FlowRun } from '@/Domains/Flow/types';
import { SelectionButtonLabel } from '@/Domains/Flow/Pages/Runs/shared.styled';
import * as S from './styled';

interface Props {
    runs: FlowRun[];
    deleting: boolean;
    onClear: (runs: FlowRun[]) => void;
    onDelete: (runs: FlowRun[]) => void;
}

export default function SelectionActions({ runs, deleting, onClear, onDelete }: Props) {
    if (runs.length === 0) return null;

    return (
        <S.SelectionActions>
            <Button variant="secondary" size="sm" disabled={deleting} onClick={() => onClear(runs)}>
                <Icon icon="lucide:x" width={14} />
                <SelectionButtonLabel>Clear</SelectionButtonLabel>
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={() => onDelete(runs)}>
                <Icon icon="lucide:trash-2" width={14} />
                <SelectionButtonLabel>Delete ({runs.length})</SelectionButtonLabel>
            </Button>
        </S.SelectionActions>
    );
}
