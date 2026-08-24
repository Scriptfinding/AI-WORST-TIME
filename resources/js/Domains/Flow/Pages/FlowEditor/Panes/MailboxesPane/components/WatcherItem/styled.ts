import styled from 'styled-components';

export const WatcherItem = styled.div`
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    transition: border-color ${({ theme }) => theme.transition.fast};
`;

export const WatcherItemHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    cursor: pointer;
    transition: background ${({ theme }) => theme.transition.fast};
    &:hover { background: ${({ theme }) => theme.colors.bg.hover}; }
`;

export const WatcherItemIcon = styled.span<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme, $active }) => $active ? theme.colors.accent.success + '10' : theme.colors.bg.primary};
    color: ${({ theme, $active }) => $active ? theme.colors.accent.success : theme.colors.text.tertiary};
    svg { width: 14px; height: 14px; }
`;

export const WatcherItemMeta = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const WatcherItemName = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.secondary};
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const WatcherItemInfo = styled.span`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
`;

export const WatcherItemActions = styled.div`
    display: flex;
    gap: 4px;
    align-items: center;
`;

export const OverflowWrap = styled.div`
    position: relative;
`;

export const OverflowBtn = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: none;
    border: none;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.text.tertiary};
    transition: color ${({ theme }) => theme.transition.fast}, background ${({ theme }) => theme.transition.fast};
    &:hover { color: ${({ theme }) => theme.colors.text.primary}; background: ${({ theme }) => theme.colors.bg.tertiary}; }
`;

export const OverflowMenu = styled.div`
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 60;
    min-width: 140px;
    margin-top: 2px;
    padding: 4px 0;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
`;

export const OverflowMenuItem = styled.button<{ $danger?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 12px;
    font-size: 12px;
    background: none;
    border: none;
    cursor: pointer;
    color: ${({ theme, $danger }) => $danger ? theme.colors.accent.error : theme.colors.text.primary};
    transition: background ${({ theme }) => theme.transition.fast};
    &:hover { background: ${({ theme }) => theme.colors.bg.hover}; }
`;
