import { Icon } from '@/Shared/UI/Icon/Icon';
import type { MetaPresence } from '@/Domains/Flow/Pages/FlowEditor/Panes/RunsPane/components/RunsPaneFilters/types';
import * as S from './styled';

interface Props {
    disabled?: boolean;
    value: MetaPresence;
    onChange: (value: MetaPresence) => void;
}

const options = [
    { value: 'none', tone: 'none', icon: 'lucide:x', label: 'Sans meta' },
    { value: '', tone: 'neutral', icon: 'lucide:minus', label: 'Peu importe' },
    { value: 'any', tone: 'any', icon: 'lucide:check', label: 'Avec meta' },
] as const;

export default function PresenceFilters({ disabled = false, value, onChange }: Props) {
    return (
        <S.Section>
            <S.Title>Meta presence</S.Title>
            <S.Group aria-label="Meta presence filter">
                {options.map(option => (
                    <S.Button
                        key={option.tone}
                        type="button"
                        $active={value === option.value}
                        $tone={option.tone}
                        disabled={disabled}
                        onClick={() => onChange(option.value)}
                        title={option.label}
                        aria-label={option.label}
                    >
                        <Icon icon={option.icon} width={12} height={12} />
                    </S.Button>
                ))}
            </S.Group>
        </S.Section>
    );
}
