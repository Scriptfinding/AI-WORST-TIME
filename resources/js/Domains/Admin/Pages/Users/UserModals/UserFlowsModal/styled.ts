import styled from 'styled-components';
import { modalItemStyles } from '@/Domains/Admin/Pages/Users/UserModals/shared.styled';

export const Item = styled.a`
    ${modalItemStyles};
    text-decoration: none;
    transition: background 120ms ease;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const ItemEnd = styled.div`
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
