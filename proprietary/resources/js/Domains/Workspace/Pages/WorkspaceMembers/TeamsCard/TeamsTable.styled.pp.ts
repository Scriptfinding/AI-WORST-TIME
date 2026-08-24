import styled from 'styled-components';

export const TableWrapper = styled.div`
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
`;

export const Table = styled.table`
    width: 100%;
    min-width: 640px;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};

    th {
        padding: 10px 14px;
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 11px;
        font-weight: 600;
        text-align: left;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
        background: ${({ theme }) => theme.colors.bg.secondary};
    }

    thead th:first-child {
        border-top-left-radius: ${({ theme }) => theme.radius.lg};
    }

    thead th:last-child {
        border-top-right-radius: ${({ theme }) => theme.radius.lg};
    }

    th.center,
    td.center {
        text-align: center;
    }

    td {
        padding: 8px 14px;
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 13px;
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
        white-space: nowrap;
        background: ${({ theme }) => theme.colors.bg.primary};
    }

    tbody tr:last-child > td {
        border-bottom: 0;
    }

    tbody tr:last-child > td:first-child {
        border-bottom-left-radius: ${({ theme }) => theme.radius.lg};
    }

    tbody tr:last-child > td:last-child {
        border-bottom-right-radius: ${({ theme }) => theme.radius.lg};
    }
`;

export const TableEmptyCell = styled.td`
    text-align: center;
    padding: 24px 14px !important;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;
