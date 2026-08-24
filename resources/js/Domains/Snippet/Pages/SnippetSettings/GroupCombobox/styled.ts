import styled from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
`;

export const Label = styled.label`
    display: block;
    margin-bottom: 5px;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 11px;
    font-weight: 600;
`;

export const Trigger = styled.button<{ $open?: boolean; $hasValue?: boolean }>`
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 7px 10px;
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ $hasValue, theme }) => $hasValue ? theme.colors.text.primary : theme.colors.text.tertiary};
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    svg:last-child {
        flex-shrink: 0;
        margin-left: auto;
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
    top: calc(100% + 4px);
    right: 0;
    left: 0;
    z-index: 1100;
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    animation: dropIn 120ms ease;
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
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $active, theme }) => $active ? theme.colors.accent.primary + '14' : 'transparent'};
    color: ${({ $active, theme }) => $active ? theme.colors.accent.primary : theme.colors.text.primary};
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
    align-items: center;
    gap: 8px;
    width: 100%;
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

    svg {
        flex-shrink: 0;
    }
`;

export const Empty = styled.div`
    padding: 12px 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    text-align: center;
`;
