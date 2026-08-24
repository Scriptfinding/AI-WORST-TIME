import styled from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
`;

export const Label = styled.label`
    display: block;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 4px;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Trigger = styled.button<{ $open?: boolean; $hasValue?: boolean }>`
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ $hasValue, theme }) => $hasValue ? theme.colors.text.primary : theme.colors.text.tertiary};
    cursor: pointer;
    text-align: left;
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
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    padding: 0 2px;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const Panel = styled.div`
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    z-index: 1100;
    overflow: hidden;
    animation: dropIn 120ms ease;
`;

export const SearchWrapper = styled.div`
    padding: 6px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const SearchInput = styled.input`
    width: 100%;
    padding: 6px 8px;
    font-size: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

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
    font-size: 13px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $active, theme }) => $active ? theme.colors.accent.primary + '14' : 'transparent'};
    color: ${({ $active, theme }) => $active ? theme.colors.accent.primary : theme.colors.text.primary};
    font-weight: ${({ $active }) => $active ? 600 : 400};
    cursor: pointer;
    text-align: left;

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
    font-size: 13px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: transparent;
    color: ${({ theme }) => theme.colors.accent.primary};
    font-weight: 500;
    cursor: pointer;
    text-align: left;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    svg {
        flex-shrink: 0;
    }
`;

export const Empty = styled.div`
    padding: 12px 10px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
`;
