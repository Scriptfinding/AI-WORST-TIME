import styled from 'styled-components';

export const Cell = styled.td<{ $center?: boolean; $right?: boolean }>`
    padding: 10px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    text-align: ${({ $center, $right }) => $center ? 'center' : ($right ? 'right' : 'left')};
    white-space: nowrap;

    tr:last-child & {
        border-bottom: none;
    }
`;

export const IdCell = styled(Cell)`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    font-variant-numeric: tabular-nums;
`;

export const NameCell = styled(Cell)`
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: 500;
`;

export const Name = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const LookupKey = styled.code`
    display: inline-flex;
    padding: 3px 7px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 11px;
`;

export const Owner = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
`;

export const EmptyValue = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

const Count = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    padding: 2px 8px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
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

export const Actions = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const IconButton = styled.button<{ $danger?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: 1px solid transparent;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.tertiary};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme, $danger }) =>
            $danger ? 'transparent' : theme.colors.border.default};
        background: ${({ theme, $danger }) =>
            $danger ? theme.colors.accent.errorBg : theme.colors.bg.hover};
        color: ${({ theme, $danger }) =>
            $danger ? theme.colors.accent.error : theme.colors.text.primary};
    }
`;
