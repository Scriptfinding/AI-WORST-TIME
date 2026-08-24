import styled from 'styled-components';

export const ComboboxClear = styled.span`
    display: flex;
    align-items: center;
    margin-left: auto;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    padding: 0 2px;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const ComboboxCreate = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    font-size: 13px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: transparent;
    color: ${({ theme }) => theme.colors.accent.primary};
    font-weight: 500;
    cursor: pointer;
    text-align: left;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    svg {
        flex-shrink: 0;
    }
`;
