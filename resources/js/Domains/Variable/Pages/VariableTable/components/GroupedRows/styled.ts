import styled from 'styled-components';

export const GroupRow = styled.tr`
    td {
        padding: 0;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: ${({ theme }) => theme.colors.text.tertiary};
        background: ${({ theme }) => theme.colors.bg.tertiary};
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    }
`;

export const GroupHeaderButton = styled.button<{ $depth: number }>`
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 6px 14px;
    padding-left: ${({ $depth }) => `${14 + $depth * 16}px`};
    font: inherit;
    text-transform: inherit;
    letter-spacing: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.secondary};
        background: ${({ theme }) => theme.colors.bg.secondary};
    }

    svg {
        flex-shrink: 0;
    }
`;

export const GroupCount = styled.span`
    margin-left: auto;
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    opacity: 0.8;
`;
