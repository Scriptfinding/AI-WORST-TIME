import styled from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
`;

export const Label = styled.label`
    display: block;
    margin-bottom: 4px;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 500;
`;

export const Trigger = styled.button<{ $open?: boolean; $hasValue?: boolean }>`
    display: flex;
    width: 100%;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border: 1px solid ${({ $open, theme }) => (
        $open ? theme.colors.accent.primary : theme.colors.border.default
    )};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ $hasValue, theme }) => (
        $hasValue ? theme.colors.text.primary : theme.colors.text.tertiary
    )};
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    svg:last-child {
        margin-left: auto;
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
        transition: transform 150ms ease;
        transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'none'};
    }
`;

export const Clear = styled.span`
    display: flex;
    align-items: center;
    margin-left: auto;
    padding: 0 2px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const Panel = styled.div`
    position: absolute;
    z-index: 1100;
    top: calc(100% + 4px);
    right: 0;
    left: 0;
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
`;

export const SearchWrapper = styled.div`
    padding: 6px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const SearchInput = styled.input`
    width: 100%;
    padding: 6px 8px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    outline: none;
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const List = styled.div`
    max-height: 220px;
    overflow-y: auto;
    padding: 4px;
`;

export const Item = styled.button<{ $active?: boolean }>`
    display: flex;
    width: 100%;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $active, theme }) => (
        $active ? `${theme.colors.accent.primary}14` : 'transparent'
    )};
    color: ${({ $active, theme }) => (
        $active ? theme.colors.accent.primary : theme.colors.text.primary
    )};
    font-size: 13px;
    font-weight: ${({ $active }) => $active ? 600 : 400};
    text-align: left;
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const Create = styled.button`
    display: flex;
    width: 100%;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: transparent;
    color: ${({ theme }) => theme.colors.accent.primary};
    font-size: 13px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const Empty = styled.div`
    padding: 12px 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    text-align: center;
`;
