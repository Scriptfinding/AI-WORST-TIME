import styled from 'styled-components';

export const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
`;

export const Toolbar = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
`;

export const SearchForm = styled.form`
    display: contents;
`;

export const SearchBar = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.tertiary};
    min-width: 200px;
    max-width: 280px;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:focus-within {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const SearchInput = styled.input`
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
    min-width: 0;

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

export const FilterResetBanner = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 9px 12px;
    margin: -4px 0 16px;
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

    svg {
        flex-shrink: 0;
    }
`;
