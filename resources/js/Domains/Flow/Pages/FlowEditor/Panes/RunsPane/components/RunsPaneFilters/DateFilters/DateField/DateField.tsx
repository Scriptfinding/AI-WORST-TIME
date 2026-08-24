import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface Props {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

export default function DateField({ label, value, onChange }: Props) {
    return (
        <S.Field>
            <S.Label>{label}</S.Label>
            <S.InputRow>
                <S.Input
                    type="datetime-local"
                    value={value}
                    onChange={event => onChange(event.target.value)}
                />
                {value && (
                    <S.Clear type="button" onClick={() => onChange('')} title="Clear">
                        <Icon icon="lucide:x" width={10} height={10} />
                    </S.Clear>
                )}
            </S.InputRow>
        </S.Field>
    );
}
