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
    margin-bottom: 16px;
    flex-wrap: wrap;
`;

export const SearchForm = styled.form`
    display: contents;
`;

export const SearchInput = styled.input`
    flex: 1;
    min-width: 180px;
    max-width: 320px;
    padding: 7px 10px 7px 32px;
    font-size: 13px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    transition: border-color ${({ theme }) => theme.transition.fast};

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const SearchWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 180px;
    max-width: 320px;

    > svg {
        position: absolute;
        left: 10px;
        width: 14px;
        height: 14px;
        color: ${({ theme }) => theme.colors.text.tertiary};
        pointer-events: none;
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
