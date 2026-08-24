import React from 'react';
import * as S from './Select.styled';
import * as Shared from './shared.styled';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export default function Select({ label, error, options, id, ...props }: SelectProps) {
    const generatedId = React.useId();
    const controlId = id ?? generatedId;

    return (
        <Shared.Wrapper $fullWidth>
            {label && <Shared.Label htmlFor={controlId}>{label}</Shared.Label>}
            <S.StyledSelect id={controlId} $hasError={!!error} {...props}>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </S.StyledSelect>
            {error && <Shared.Error>{error}</Shared.Error>}
        </Shared.Wrapper>
    );
}
