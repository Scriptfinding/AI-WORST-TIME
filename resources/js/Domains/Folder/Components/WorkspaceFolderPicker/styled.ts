import styled, { css } from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import type { FolderScope } from './types';

export const Tree = styled.div`
    display: flex;
    flex-direction: column;
    max-height: 320px;
    overflow-y: auto;
`;

function scopeColor(scope: FolderScope | undefined, theme: DefaultTheme) {
    if (scope === 'team') return theme.colors.accent.success;
    if (scope === 'workspace') return theme.colors.accent.info;
    return '#e5a00d';
}

export const RootRow = styled.button<{
    $active: boolean;
    $scope?: FolderScope;
}>`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border: none;
    background: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
    cursor: pointer;
    transition: background ${({ theme }) => theme.transition.fast};
    width: 100%;
    text-align: left;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    ${({ $active, $scope, theme }) =>
        $active &&
        css`
            background: ${scopeColor($scope, theme)}15;
            color: ${scopeColor($scope, theme)};

            &:hover {
                background: ${scopeColor($scope, theme)}20;
            }
        `}
`;

export const RootIcon = styled.div<{
    $workspace: boolean;
    $scope?: FolderScope;
}>`
    color: ${({ theme, $scope, $workspace }) =>
        $scope
            ? scopeColor($scope, theme)
            : $workspace
              ? theme.colors.accent.info
              : '#e5a00d'};
    flex-shrink: 0;
    display: flex;

    svg {
        width: 16px;
        height: 16px;
    }
`;

export const RootName = styled.span`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const AddButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    background: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};
    color: ${({ theme }) => theme.colors.text.tertiary};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;
