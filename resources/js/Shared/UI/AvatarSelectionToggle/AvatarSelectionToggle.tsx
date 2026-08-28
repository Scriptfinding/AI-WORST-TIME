import type { ReactNode } from 'react';
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
                <S.Checkbox $selected={selected} $size={size}>
                    {selected && (
                        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    )}
                </S.Checkbox>
            </S.Frame>
        </S.Label>
    );
}
