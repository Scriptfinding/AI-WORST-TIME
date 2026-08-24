import styled from 'styled-components';
import { tableCellStyles } from '@/Domains/Admin/Pages/Users/UserTable/shared.styled';

export const Cell = styled.td<{ $center?: boolean; $right?: boolean }>`
    ${tableCellStyles};
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.secondary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};

    tr:last-child & {
        border-bottom: none;
    }
`;

export const IdCell = styled(Cell)`
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const NameCell = styled(Cell)`
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const Name = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const Email = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const Count = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const ClickableCount = styled(Count)`
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.accent.primary};
        color: white;
    }
`;

export const DisabledCount = styled(Count)`
    opacity: 0.35;
`;
