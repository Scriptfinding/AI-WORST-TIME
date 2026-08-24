import styled from 'styled-components';

export const Item = styled.button<{ $danger?: boolean }>`
    width: 100%;
    min-height: 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 7px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme, $danger }) => $danger ? theme.colors.accent.error : theme.colors.text.primary};
    background: transparent;
    cursor: pointer;
    font-size: 12px;
    text-align: left;

    &:hover,
    &:focus-visible {
        color: ${({ theme, $danger }) => $danger ? theme.colors.accent.error : theme.colors.text.primary};
        background: ${({ theme, $danger }) => $danger ? theme.colors.accent.errorBg : theme.colors.bg.hover};
        outline: none;
    }

    &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }
`;

export const Label = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const Divider = styled.div`
    height: 1px;
    margin: 5px 4px;
    background: ${({ theme }) => theme.colors.border.default};
`;
