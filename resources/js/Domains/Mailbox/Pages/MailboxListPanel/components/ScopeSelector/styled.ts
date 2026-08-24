import styled from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
`;

export const Trigger = styled.button<{ $open?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: ${({ $open }) => $open ? '100%' : 'auto'};
    padding: ${({ $open }) => $open ? '5px 8px' : '5px 6px'};
    font-size: 11px;
    text-align: left;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.border.focus : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.primary};
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.border.focus};
    }

    svg {
        flex-shrink: 0;
    }
`;

export const Panel = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    margin-top: 4px;
    min-width: 180px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    overflow: hidden;
`;

export const Search = styled.input`
    width: 100%;
    padding: 6px 8px;
    font-size: 11px;
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const List = styled.div`
    max-height: 200px;
    overflow-y: auto;
    padding: 4px;
`;

export const Item = styled.button<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 5px 8px;
    font-size: 12px;
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

export const Separator = styled.div`
    height: 1px;
    background: ${({ theme }) => theme.colors.border.default};
    margin: 4px 0;
`;

export const SectionLabel = styled.div`
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    padding: 3px 8px 1px;
`;

export const Empty = styled.div`
    padding: 10px 8px;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
`;
