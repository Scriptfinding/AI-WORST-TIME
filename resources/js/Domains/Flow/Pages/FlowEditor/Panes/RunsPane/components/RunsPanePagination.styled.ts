import styled from 'styled-components';

export const RunPaginationBar = styled.div<{ $position: 'top' | 'bottom' }>`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: ${({ $position }) => $position === 'top' ? 0 : '8px'};
    margin-bottom: ${({ $position }) => $position === 'top' ? '8px' : 0};
    padding-top: ${({ $position }) => $position === 'top' ? 0 : '8px'};
    border-top: ${({ theme, $position }) => $position === 'top' ? 0 : `1px solid ${theme.colors.border.default}`};
`;

export const PerPageWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
`;

export const PerPageLabel = styled.span<{ $summary?: boolean }>`
    margin-right: ${({ $summary }) => $summary ? 'auto' : 0};
    font-size: 10px;
    color: ${({ theme, $summary }) => $summary ? 'inherit' : theme.colors.text.tertiary};
    white-space: nowrap;
`;

export const PerPageSelect = styled.select`
    padding: 3px 6px;
    font-size: 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    flex-shrink: 0;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const RunPagination = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    flex-wrap: wrap;
`;

export const RunPageLink = styled.button<{ $active?: boolean }>`
    padding: 3px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 11px;
    color: ${({ theme, $active }) =>
        $active ? 'white' : theme.colors.text.secondary};
    background: ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary : 'transparent'};

    &:hover:not(:disabled) {
        background: ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary : theme.colors.bg.hover};
    }

    &:disabled {
        opacity: 0.4;
        cursor: default;
    }
`;
