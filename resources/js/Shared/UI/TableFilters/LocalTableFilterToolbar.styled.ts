import styled from 'styled-components';

export const Container = styled.div<{ $compact?: boolean }>`
    margin-top: ${({ $compact }) => $compact ? 0 : '18px'};
`;

export const Toolbar = styled.div<{ $compact?: boolean }>`
    display: flex;
    align-items: center;
    gap: ${({ $compact }) => $compact ? '6px' : '8px'};
    flex-wrap: ${({ $compact }) => $compact ? 'nowrap' : 'wrap'};
`;

export const SearchBar = styled.div<{ $compact?: boolean }>`
    display: flex;
    flex: ${({ $compact }) => $compact ? 1 : 'initial'};
    align-items: center;
    gap: 6px;
    min-width: ${({ $compact }) => $compact ? 0 : '200px'};
    max-width: ${({ $compact }) => $compact ? 'none' : '280px'};
    height: ${({ $compact }) => $compact ? '26px' : 'auto'};
    padding: ${({ $compact }) => $compact ? '5px 8px' : '6px 10px'};
    box-sizing: border-box;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme, $compact }) => $compact ? theme.radius.sm : theme.radius.md};
    background: ${({ theme, $compact }) => $compact ? theme.colors.bg.secondary : theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.tertiary};
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:focus-within {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const SearchInput = styled.input<{ $compact?: boolean }>`
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: ${({ $compact }) => $compact ? '11px' : '13px'};

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const SearchClear = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    transition: color ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const SortButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    padding: 4px;
    box-sizing: border-box;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        border-color: ${({ theme }) => theme.colors.border.focus};
    }
`;

export const ResetBanner = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 10px;
    padding: 9px 12px;
    border: 1px solid ${({ theme }) => theme.colors.accent.primary}33;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.primary}10;
    color: ${({ theme }) => theme.colors.accent.primary};
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.accent.primary}18;
        border-color: ${({ theme }) => theme.colors.accent.primary}66;
    }
`;
