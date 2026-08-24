import { RUN_STATUSES } from '@/Domains/Flow/Pages/runHistory';
import { ucfirst } from '@/Shared/Utils/string';
import * as S from './styled';

interface Props {
    selectedStatuses: Set<string>;
    onToggle: (status: string) => void;
}

export default function StatusFilters({ selectedStatuses, onToggle }: Props) {
    return (
        <S.Section>
            <S.Title>Status</S.Title>
            <S.ChipRow>
                {RUN_STATUSES.map(status => (
                    <S.Chip
                        key={status}
                        type="button"
                        $active={selectedStatuses.has(status)}
                        onClick={() => onToggle(status)}
                    >
                        {ucfirst(status)}
                    </S.Chip>
                ))}
            </S.ChipRow>
        </S.Section>
    );
}
