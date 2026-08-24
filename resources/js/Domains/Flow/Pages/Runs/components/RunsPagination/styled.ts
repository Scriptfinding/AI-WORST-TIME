import styled from 'styled-components';

export const PaginationWrap = styled.div<{ $position?: 'top' | 'bottom' }>`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: ${({ $position }) => $position === 'top' ? '0' : '12px'};
    margin-bottom: ${({ $position }) => $position === 'top' ? '0' : '48px'};

    @media (max-width: 768px) {
        justify-content: flex-start;
    }
`;

export const PaginationBar = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
`;

export const PaginationTotal = styled.div`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
`;

export const PaginationLimit = styled.label`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    white-space: nowrap;
`;

export const PaginationLimitSelect = styled.select`
    height: 24px;
    padding: 0 6px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 10px;
`;

export const PageLink = styled.button<{ $active?: boolean }>`
    padding: 4px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme, $active }) => $active ? theme.colors.accent.primary : 'transparent'};
    color: ${({ theme, $active }) => $active ? '#fff' : theme.colors.text.secondary};
    font-size: 11px;

    &:hover:not(:disabled) {
        background: ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.bg.hover};
    }

    &:disabled {
        opacity: 0.4;
        cursor: default;
    }
`;

export const PageEllipsis = styled.span`
    padding: 4px 6px;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
