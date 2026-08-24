import styled, { css } from 'styled-components';

export const TableWrap = styled.div`
    overflow-x: auto;
`;

export const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
`;

export const HeaderCell = styled.th`
    padding: 8px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const Cell = styled.td`
    padding: 8px 12px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    overflow-wrap: break-word;
    word-break: break-all;
`;

export const ValueCell = styled(Cell)<{ $mono?: boolean }>`
    ${({ $mono }) => $mono && css`
        font-family: var(--font-mono, monospace);
        font-size: 12px;
    `}
`;

export const TypeBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ theme }) => theme.colors.accent.defaultBg};
    color: ${({ theme }) => theme.colors.accent.default};
`;
