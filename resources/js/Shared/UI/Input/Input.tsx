import React, { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './Input.styled';
import * as Shared from './shared.styled';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: React.ReactNode;
    fullWidth?: boolean;
    showCharCount?: boolean;
}

export default function Input({ label, error, hint, fullWidth = true, showCharCount, maxLength, value, type, id, ...props }: InputProps) {
    const generatedId = React.useId();
    const controlId = id ?? generatedId;
    const len = showCharCount && maxLength ? String(value ?? '').length : 0;
    const hasInputFooter = error || hint || (showCharCount && maxLength);
    const isPassword = type === 'password';
    const [visible, setVisible] = useState(false);

    return (
        <Shared.Wrapper $fullWidth={fullWidth}>
            {label && <Shared.Label htmlFor={controlId}>{label}</Shared.Label>}
            <S.InputRow>
                <S.StyledInput
                    $hasError={!!error}
                    $hasTrailing={isPassword}
                    id={controlId}
                    maxLength={maxLength}
                    value={value}
                    type={isPassword && visible ? 'text' : type}
                    {...props}
                />
                {isPassword && (
                    <S.ToggleVisibility type="button" onClick={() => setVisible(v => !v)} tabIndex={-1}>
                        <Icon icon={visible ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} width={16} />
                    </S.ToggleVisibility>
                )}
            </S.InputRow>
            {hasInputFooter && (
                <S.InputFooter>
                    {error ? <Shared.Error>{error}</Shared.Error> : hint && <S.Hint>{hint}</S.Hint>}
                    {showCharCount && maxLength && (
                        <S.CharCount $warn={len > maxLength * 0.9}>{len}/{maxLength}</S.CharCount>
                    )}
                </S.InputFooter>
            )}
        </Shared.Wrapper>
    );
}

export { default as Select } from './Select';
export { default as TextArea } from './TextArea';
