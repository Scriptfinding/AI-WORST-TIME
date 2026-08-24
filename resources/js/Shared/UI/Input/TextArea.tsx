import React from 'react';
import * as S from './TextArea.styled';
import * as Shared from './shared.styled';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export default function TextArea({ label, error, fullWidth = true, id, ...props }: TextAreaProps) {
    const generatedId = React.useId();
    const controlId = id ?? generatedId;

    return (
        <Shared.Wrapper $fullWidth={fullWidth}>
            {label && <Shared.Label htmlFor={controlId}>{label}</Shared.Label>}
            <S.TextArea id={controlId} $hasError={!!error} {...props} />
            {error && <Shared.Error>{error}</Shared.Error>}
        </Shared.Wrapper>
    );
}
