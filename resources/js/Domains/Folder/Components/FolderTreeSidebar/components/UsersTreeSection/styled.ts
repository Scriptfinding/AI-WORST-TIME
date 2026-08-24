import styled from 'styled-components';
import * as TeamS from '@/Domains/Folder/Components/FolderTreeSidebar/components/TeamTreeSection/styled';
import * as SectionS from '@/Domains/Folder/Components/FolderTreeSidebar/components/WorkspaceTreeSection/styled';

export const HeaderIconSlot = styled(SectionS.IconSlot)`
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Row = TeamS.Row;

export const Chevron = TeamS.Chevron;

export const IconSlot = styled(TeamS.IconSlot)`
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Label = TeamS.Label;
