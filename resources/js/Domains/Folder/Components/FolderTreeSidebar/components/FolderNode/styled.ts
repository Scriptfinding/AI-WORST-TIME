import styled, { css } from 'styled-components';
import { TreeIconSlot, TreeRow } from '@/Domains/Folder/Components/FolderTreeSidebar/components/shared.styled';

export const IconSlot = styled(TreeIconSlot)`
    width: 15px;
    height: 15px;
    color: ${({ theme }) => theme.colors.text.tertiary};

    svg {
        width: 15px;
        height: 15px;
    }
`;

export const Row = styled(TreeRow)<{ $active: boolean }>`
    font-size: 13px;

    &:hover {
        ${IconSlot} > svg {
            display: none;
        }
    }

    ${({ $active, theme }) => $active && css`
        background: ${theme.mode === 'light' ? theme.colors.bg.tertiary : theme.colors.bg.active};
        color: ${theme.colors.text.primary};
        font-weight: 500;

        &:hover {
            background: ${theme.mode === 'light' ? theme.colors.bg.tertiary : theme.colors.bg.active};
        }
    `}
`;

export const Chevron = styled.span<{ $visible: boolean; $expanded: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    border-radius: 3px;
    visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
    transition: background ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }

    svg {
        width: 12px;
        height: 12px;
        transition: transform 0.15s ease;
        transform: ${({ $expanded }) => ($expanded ? 'rotate(90deg)' : 'rotate(0deg)')};
    }
`;
