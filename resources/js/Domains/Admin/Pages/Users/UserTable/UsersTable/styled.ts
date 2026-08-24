import styled from 'styled-components';
import { tableCellStyles } from '@/Domains/Admin/Pages/Users/UserTable/shared.styled';

export const TableWrapper = styled.div`
    overflow-x: auto;
`;

export const Table = styled.table`
    width: 100%;
    border-collapse: collapse;

    tbody tr {
        transition: background ${({ theme }) => theme.transition.fast};

        &:hover {
            background: ${({ theme }) => theme.colors.bg.hover};
        }
    }
`;

export const Th = styled.th<{ $center?: boolean; $right?: boolean }>`
    ${tableCellStyles};
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const EmptyCell = styled.td`
    padding: 10px 16px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.secondary};
    border-bottom: none;
    white-space: nowrap;
`;

export const EmptyState = styled.div`
    text-align: center;
    padding: 48px 20px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
`;
