import styled from 'styled-components';

export const Toolbar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
    flex-shrink: 0;
`;

export const ToolbarRight = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const SearchBox = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 280px;
    padding: 8px 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const SearchInput = styled.input`
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const SortTabs = styled.div`
    display: flex;
    gap: 4px;
    padding: 3px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const SortTab = styled.button<{ $active?: boolean }>`
    padding: 6px 10px;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $active, theme }) => $active ? theme.colors.accent.primary + '18' : 'transparent'};
    color: ${({ $active, theme }) => $active ? theme.colors.accent.primary : theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
`;
