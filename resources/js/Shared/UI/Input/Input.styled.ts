import styled, { css } from 'styled-components';
import { controlStyles } from './shared.styled';

export const InputRow = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
`;

export const StyledInput = styled.input<{ $hasError?: boolean; $hasTrailing?: boolean }>`
    ${controlStyles}
    ${({ $hasTrailing }) => $hasTrailing && css`padding-right: 36px;`}
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

export const ToggleVisibility = styled.button`
    position: absolute;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.text.tertiary};
    transition: color ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.secondary};
    }
`;

export const InputFooter = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 0;
`;

export const Hint = styled.span`
    min-width: 0;
    font-size: 11px;
    line-height: 1.35;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const CharCount = styled.span<{ $warn?: boolean }>`
    font-size: 10px;
    color: ${({ theme, $warn }) => $warn ? theme.colors.accent.warning : theme.colors.text.tertiary};
    margin-left: auto;
    opacity: 0.7;
`;
