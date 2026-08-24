import styled, { css } from 'styled-components';

export const TableWrap = styled.div`
    overflow-x: auto;
    margin-bottom: 8px;
`;

export const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
`;

export const HeaderCell = styled.th`
    padding: 6px 10px;
    text-align: left;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const Cell = styled.td<{ $mono?: boolean }>`
    padding: 6px 10px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.primary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    overflow-wrap: break-word;
    word-break: break-all;
    ${({ $mono, theme }) => $mono && css`font-family: ${theme.font.mono}; font-size: 11px;`}
`;

export const Badge = styled.span`
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    font-weight: 500;
    padding: 1px 7px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ theme }) => theme.colors.accent.defaultBg};
    color: ${({ theme }) => theme.colors.accent.default};
`;
