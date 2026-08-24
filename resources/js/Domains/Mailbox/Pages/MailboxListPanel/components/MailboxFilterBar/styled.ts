import styled from 'styled-components';

export const FilterBar = styled.div`
    padding: 8px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 42px;
    min-height: 42px;
    box-sizing: border-box;
`;

export const FilterResetBanner = styled.button`
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: calc(100% - 20px);
    margin: 8px 10px;
    padding: 8px 10px;
    border: 1px solid ${({ theme }) => theme.colors.accent.primary}33;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.primary}10;
    color: ${({ theme }) => theme.colors.accent.primary};
    font-size: 11px;
    font-weight: 600;
    line-height: 1.3;
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.accent.primary}18;
        border-color: ${({ theme }) => theme.colors.accent.primary}66;
    }

    svg {
        flex-shrink: 0;
    }
`;

export const FilterSelect = styled.select`
    flex: 1;
    min-width: 0;
    padding: 5px 8px;
    font-size: 11px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:focus {
        border-color: ${({ theme }) => theme.colors.border.focus};
    }
`;

export const QuickSearch = styled.input`
    flex: 1;
    min-width: 0;
    padding: 5px 8px;
    font-size: 11px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:focus {
        border-color: ${({ theme }) => theme.colors.border.focus};
    }

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const SortBtn = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 4px;
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
