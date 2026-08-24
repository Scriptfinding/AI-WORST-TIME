import styled from 'styled-components';

export const Empty = styled.div`
    text-align: center;
    padding: 40px 20px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
`;

export const TableWrapper = styled.div`
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
`;

export const Table = styled.table`
    width: 100%;
    min-width: 900px;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    overflow: hidden;
`;

export const Thead = styled.thead`
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const Th = styled.th<{ $width?: number }>`
    width: ${({ $width }) => $width ? `${$width}px` : undefined};
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    padding: 10px 14px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const Pagination = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin-top: 16px;
`;

export const PageLink = styled.button<{ $active?: boolean }>`
    padding: 4px 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 12px;
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
