import styled from 'styled-components';
import { controlStyles } from './shared.styled';

export const TextArea = styled.textarea<{ $hasError?: boolean }>`
    ${controlStyles}
    resize: vertical;
    min-height: 80px;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.border.focus};
        box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.border.focus}26`};
    }

    &:disabled {
        background: ${({ theme }) => theme.colors.bg.tertiary};
        cursor: not-allowed;
        opacity: 0.7;
    }
`;
