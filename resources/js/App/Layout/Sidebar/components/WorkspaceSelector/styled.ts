import styled from 'styled-components';

export const Wrapper = styled.div<{ $collapsed?: boolean }>`
    position: relative;
    margin: 0 12px 12px;
    display: ${({ $collapsed }) => ($collapsed ? 'none' : 'block')};
`;

export const Select = styled.button`
    width: 100%;
    padding: 8px 10px;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.border.light};
    }
`;

export const Name = styled.span`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const Item = styled.a<{ $active?: boolean; $highlighted?: boolean }>`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ $active, theme }) => ($active ? theme.colors.bg.hover : 'transparent')};
    transition: background ${({ theme }) => theme.transition.fast};
    cursor: pointer;
    overflow: hidden;
    white-space: nowrap;

    svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }

    ${({ $active, $highlighted, theme }) =>
        ($active || $highlighted) && `color: ${theme.colors.text.primary};`}

    ${({ $highlighted, theme }) =>
        $highlighted &&
        `background: color-mix(in srgb, ${theme.colors.bg.hover} 55%, transparent);`}

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) =>
            `color-mix(in srgb, ${theme.colors.bg.hover} 55%, transparent)`};
    }
`;

export const Dropdown = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 100%;
    width: max-content;
    margin-top: 4px;
    padding: 6px;
    max-height: 200px;
    overflow-y: auto;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.md};
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 120px;
    z-index: 50;
`;

export const DropdownTitle = styled.div`
    flex-shrink: 0;
    padding: 4px 8px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-bottom: 4px;
`;

export const SearchWrapper = styled.div`
    position: sticky;
    top: -6px;
    z-index: 1;
    display: flex;
    flex-shrink: 0;
    margin-bottom: 2px;
    padding-bottom: 4px;
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const SearchInput = styled.input`
    width: 100%;
    min-width: 0;
    padding: 8px 9px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    outline: none;
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &::-webkit-search-cancel-button {
        width: 12px;
        height: 12px;
        appearance: none;
        cursor: pointer;
        background: ${({ theme }) => theme.colors.text.tertiary};
        mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M18 6 6 18M6 6l12 12' fill='none' stroke='black' stroke-linecap='round' stroke-width='2'/%3E%3C/svg%3E")
            center / contain no-repeat;
    }
`;

export const EmptyState = styled.div`
    flex-shrink: 0;
    padding: 12px 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    text-align: center;
`;

export const ItemLabel = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
`;
