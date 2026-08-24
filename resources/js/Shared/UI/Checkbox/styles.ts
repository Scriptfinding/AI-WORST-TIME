import { css } from 'styled-components';

export const checkboxStyles = css`
    appearance: none;
    display: inline-grid;
    place-content: center;
    width: 14px;
    height: 14px;
    margin: 0;
    flex-shrink: 0;
    border: 1px solid ${({ theme }) => theme.colors.border.light};
    border-radius: ${({ theme }) => theme.radius.xs};
    background: ${({ theme }) => theme.colors.bg.primary};
    cursor: pointer;
    transition:
        background ${({ theme }) => theme.transition.fast},
        border-color ${({ theme }) => theme.transition.fast};

    &::before {
        content: '';
        width: 3px;
        height: 7px;
        margin-top: -1px;
        border: solid ${({ theme }) => theme.colors.white};
        border-width: 0 2px 2px 0;
        transform: rotate(45deg) scale(0);
        transition: transform ${({ theme }) => theme.transition.fast};
    }

    &:checked {
        background: ${({ theme }) => theme.colors.accent.primary};
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    &:checked::before {
        transform: rotate(45deg) scale(1);
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.colors.border.focus};
        outline-offset: 2px;
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
`;

export const dangerCheckboxStyles = css`
    ${checkboxStyles}

    &:checked {
        background: ${({ theme }) => theme.colors.accent.error};
        border-color: ${({ theme }) => theme.colors.accent.error};
    }
`;
