import styled, { css } from 'styled-components';

export const Item = styled.div<{ $active?: boolean; $depth: number }>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    ${({ $depth }) => $depth > 0 && css`padding-left: ${14 + $depth * 14}px;`}
    cursor: pointer;
    transition: background ${({ theme }) => theme.transition.fast};
    background: ${({ $active, theme }) => $active ? theme.colors.bg.hover : 'transparent'};
    border-left: 3px solid ${({ $active, theme }) => $active ? theme.colors.accent.primary : 'transparent'};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.secondary};
    }
`;

export const ScopeIcon = styled.span<{ $workspace?: boolean; $team?: boolean; $inactive?: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    width: 22px;
    height: 22px;
    border-radius: 5px;
    border: 1.5px solid ${({ $workspace, $team }) =>
        $workspace ? '#3b82f640' :
        $team ? '#22c55e40' :
        '#eab30840'};
    background: ${({ $workspace, $team }) =>
        $workspace ? '#3b82f614' :
        $team ? '#22c55e14' :
        '#eab30814'};
    color: ${({ $workspace, $team }) => $workspace ? '#3b82f6' : $team ? '#22c55e' : '#eab308'};
    opacity: ${({ $inactive }) => $inactive ? 0.3 : 1};
`;

export const Content = styled.div<{ $inactive?: boolean }>`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
    opacity: ${({ $inactive }) => $inactive ? 0.3 : 1};
`;

export const Title = styled.span`
    position: relative;
    min-width: 0;
    display: block;
`;

export const Label = styled.span`
    display: block;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const LibraryBadge = styled.span<{ $inactive?: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    flex-shrink: 0;
    opacity: ${({ $inactive }) => $inactive ? 0.3 : 1};
`;

export const OverflowWrapper = styled.div`
    position: relative;
    flex-shrink: 0;
    display: flex;
`;

export const OverflowButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    background: none;
    border: none;
    border-radius: ${({ theme }) => theme.radius.xs};
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const OverflowMenu = styled.div`
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 300;
    margin-top: 4px;
    min-width: 140px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    overflow: hidden;
    padding: 4px;
`;

export const OverflowMenuItem = styled.button<{ $danger?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 10px;
    font-size: 12px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: transparent;
    color: ${({ $danger, theme }) => $danger ? theme.colors.accent.error : theme.colors.text.primary};
    cursor: pointer;
    text-align: left;

    &:hover {
        background: ${({ $danger, theme }) => $danger ? theme.colors.accent.errorBg : theme.colors.bg.hover};
    }

    svg {
        flex-shrink: 0;
    }
`;
