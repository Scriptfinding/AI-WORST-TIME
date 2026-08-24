import type { ReactNode } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface Props {
    selected: boolean;
    onChange: () => void;
    label: string;
    size?: number;
    children: ReactNode;
}

export default function AvatarSelectionToggle({
    selected,
    onChange,
    label,
    size = 28,
    children,
}: Props) {
    return (
        <S.Label title={label} onClick={event => event.stopPropagation()}>
            <S.Input
                type="checkbox"
                checked={selected}
                onChange={onChange}
                aria-label={label}
            />
            <S.Frame $size={size} $selected={selected}>
                <S.Avatar $selected={selected}>{children}</S.Avatar>
                <S.Checkbox $selected={selected}>
                    {selected && <Icon icon="lucide:check" width={size * 0.5} height={size * 0.5} />}
                </S.Checkbox>
            </S.Frame>
        </S.Label>
    );
}
