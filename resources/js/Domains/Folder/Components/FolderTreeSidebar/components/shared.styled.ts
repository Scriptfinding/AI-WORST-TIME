import styled from 'styled-components';

export const TreeRow = styled.a<{ $depth: number }>`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px 5px ${({ $depth }) => 8 + $depth * 16}px;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.text.secondary};
    text-decoration: none;
    user-select: none;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.text.primary};

        [data-sidebar-overflow-button] {
            display: flex;
        }
    }
`;

export const TreeIconSlot = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
`;

export const TreeLabel = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.3;
`;

export const MenuItem = styled.button<{ $danger?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 10px;
    border: none;
    background: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 12px;
    white-space: nowrap;
    color: ${({ theme, $danger }) => $danger ? theme.colors.accent.error : theme.colors.text.primary};
    cursor: pointer;
    transition: background ${({ theme }) => theme.transition.fast};

    svg {
        flex-shrink: 0;
        color: ${({ theme, $danger }) => $danger ? theme.colors.accent.error : theme.colors.text.tertiary};
    }

    &:hover {
        background: ${({ theme, $danger }) => $danger ? theme.colors.accent.errorBg : theme.colors.bg.hover};
    }
`;

export const MenuDivider = styled.div`
    height: 1px;
    margin: 4px 0;
    background: ${({ theme }) => theme.colors.border.default};
`;
