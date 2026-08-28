import { useId } from 'react';
import * as S from './SelectAllVisible.styled';

interface Props {
    allSelected: boolean;
    className?: string;
    itemLabel: string;
    onToggle: () => void;
}

export default function SelectAllVisible({
    allSelected,
    className,
    itemLabel,
    onToggle,
}: Props) {
    const checkboxId = useId();

    return (
        <S.Container className={className}>
            <S.Checkbox
                id={checkboxId}
                type="checkbox"
                checked={allSelected}
                aria-label={`${allSelected ? 'Deselect' : 'Select'} all visible ${itemLabel}`}
                onChange={onToggle}
            />
            <S.Label htmlFor={checkboxId}>
                {allSelected ? 'All visible selected' : 'Select all visible'}
            </S.Label>
        </S.Container>
    );
}
