import styled from 'styled-components';
import { modalItemStyles } from '@/Domains/Admin/Pages/Workspaces/WorkspaceModals/shared.styled';

export const DetailItem = styled.a`
    ${modalItemStyles};
    text-decoration: none;
    transition: background 120ms ease;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const DetailItemEnd = styled.div`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
