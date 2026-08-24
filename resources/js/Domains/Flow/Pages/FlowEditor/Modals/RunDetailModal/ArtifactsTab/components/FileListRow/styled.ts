import styled from 'styled-components';

export const Row = styled.a`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    text-decoration: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    transition: background ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }

    & + & {
        border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    }
`;

export const Icon = styled.span`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Name = styled.span`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.primary};
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const Size = styled.span`
    flex-shrink: 0;
    min-width: 55px;
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: right;
`;
