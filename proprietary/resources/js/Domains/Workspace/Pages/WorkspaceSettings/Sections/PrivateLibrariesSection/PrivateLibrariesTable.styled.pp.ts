import styled from 'styled-components';

export const Wrapper = styled.div`
    width: 100%;
    max-width: 100%;
    min-width: 0;
    margin-top: 18px;
    overflow-x: auto;
`;

export const Table = styled.table`
    width: 100%;
    min-width: 1040px;
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

    td {
        padding: 8px 14px;
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 13px;
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
        white-space: nowrap;
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

export const GroupButton = styled.button`
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 6px 14px;
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
`;

export const GroupCount = styled.span`
    margin-left: auto;
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    opacity: 0.8;
`;
