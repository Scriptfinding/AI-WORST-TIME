import styled from 'styled-components';

export const Dropdown = styled.div`
    position: fixed;
    min-width: 200px;
    max-width: 280px;
    max-height: 260px;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.light};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.md};
    z-index: 9999;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const SearchWrapper = styled.div`
    position: sticky;
    top: -4px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    margin: -4px -4px 2px;
    padding: 8px 10px 6px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    z-index: 1;

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const SearchInput = styled.input`
    width: 100%;
    min-width: 0;
    padding: 5px 0;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        outline: none;
    }
`;
