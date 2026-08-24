import styled from 'styled-components';
import type { FolderScope } from '@/Domains/Folder/Components/WorkspaceFolderPicker/types';

export const Row = styled.div<{ $depth: number }>`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    padding-left: ${({ $depth }) => 10 + $depth * 18}px;
`;

export const FolderIcon = styled.div<{ $scope?: FolderScope }>`
    color: ${({ theme, $scope }) =>
        $scope === 'team'
            ? theme.colors.accent.success
            : $scope === 'workspace'
              ? theme.colors.accent.info
              : '#e5a00d'};
    flex-shrink: 0;
    display: flex;

    svg {
        width: 16px;
        height: 16px;
    }
`;

export const Input = styled.input`
    flex: 1;
    padding: 5px 8px;
    font-size: 13px;
    border: 1px solid ${({ theme }) => theme.colors.border.focus};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const Actions = styled.div`
    display: flex;
    gap: 2px;
    flex-shrink: 0;
`;

export const IconButton = styled.button<{
    $variant: 'success' | 'danger';
}>`
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
    color: ${({ theme, $variant }) =>
        $variant === 'success'
            ? theme.colors.accent.success
            : theme.colors.accent.error};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;
