import styled from 'styled-components';
import {
    TreeIconSlot,
    TreeLabel,
    TreeRow,
} from '@/Domains/Folder/Components/FolderTreeSidebar/components/shared.styled';

export const IconSlot = styled(TreeIconSlot)`
    width: 16px;
    height: 16px;

    > span:first-child {
        display: inline-flex;
    }
`;

export const Row = styled(TreeRow)`
    font-size: 12px;

    &:hover {
        ${IconSlot} > span:first-child {
            display: none;
        }
    }
`;

export const ChevronSpacer = styled.span`
    width: 16px;
    height: 16px;
    flex-shrink: 0;
`;

export const ImportedBadge = styled.span`
    position: absolute;
    left: -15px;
    top: 2px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px;
    border-radius: 4px;
    padding: 1px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const Label = styled(TreeLabel)`
    opacity: 0.75;
`;
