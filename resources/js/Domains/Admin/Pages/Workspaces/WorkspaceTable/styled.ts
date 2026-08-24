import styled from 'styled-components';

export const Panel = styled.div`
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    box-shadow: ${({ theme }) => theme.shadow.sm};
    overflow: hidden;
`;

export const TableWrapper = styled.div`
    overflow-x: auto;
`;

export const Table = styled.table`
    width: 100%;
    border-collapse: collapse;

    tbody tr {
        transition: background ${({ theme }) => theme.transition.fast};
        &:hover { background: ${({ theme }) => theme.colors.bg.hover}; }
    }
`;

export const Th = styled.th<{ $center?: boolean; $right?: boolean }>`
    text-align: ${({ $center, $right }) => $center ? 'center' : ($right ? 'right' : 'left')};
    padding: 10px 16px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    white-space: nowrap;
`;

export const EmptyCell = styled.td`
    padding: 10px 16px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.secondary};
    border-bottom: none;
    white-space: nowrap;
`;

export const EmptyState = styled.div`
    padding: 48px 20px;
    text-align: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
`;
