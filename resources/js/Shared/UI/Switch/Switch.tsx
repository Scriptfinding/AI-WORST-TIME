import React from 'react';
import * as S from './styled';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    ariaLabel?: string;
    id?: string;
    disabled?: boolean;
}

export default function Switch({ checked, onChange, label, ariaLabel, id, disabled }: SwitchProps) {
    const handleClick = () => {
        if (!disabled) onChange(!checked);
    };

    return (
        <S.Wrapper
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel ?? label}
            id={id}
            disabled={disabled}
            onClick={handleClick}
        >
            <S.Track $checked={checked}>
                <S.Thumb $checked={checked} />
            </S.Track>
            {label && <S.Label>{label}</S.Label>}
        </S.Wrapper>
    );
}
