import styled from 'styled-components';
import { controlStyles } from './shared.styled';

export const StyledSelect = styled.select<{ $hasError?: boolean }>`
    ${controlStyles}
    appearance: none;

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.border.focus};
    }

    &:disabled {
        background: ${({ theme }) => theme.colors.bg.tertiary};
        cursor: not-allowed;
        opacity: 0.7;
    }
`;
