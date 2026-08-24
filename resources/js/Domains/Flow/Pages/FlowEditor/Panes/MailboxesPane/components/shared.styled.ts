import styled from 'styled-components';

export const DropdownSearch = styled.input`
    width: 100%;
    padding: 8px 12px;
    font-size: 13px;
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    &::placeholder { color: ${({ theme }) => theme.colors.text.tertiary}; }
`;

export const DropdownList = styled.ul`
    list-style: none;
    margin: 0;
    padding: 4px 0;
    max-height: 180px;
    overflow-y: auto;
`;

export const DropdownItem = styled.li<{ $active?: boolean }>`
    padding: 7px 12px;
    font-size: 13px;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme, $active }) => $active ? theme.colors.bg.tertiary : 'transparent'};
    &:hover { background: ${({ theme }) => theme.colors.bg.tertiary}; }
`;

export const DropdownEmpty = styled.li`
    padding: 8px 12px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
