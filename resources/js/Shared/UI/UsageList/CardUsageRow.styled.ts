import styled from 'styled-components';
import { usageItemStyles } from './sharedStyled';

export const CardItem = styled.a`
    ${usageItemStyles};
    padding: 6px 8px;
    border-radius: 6px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    text-decoration: none;
    transition: background 120ms ease;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    > svg:last-child {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const CardItemLabel = styled.div`
    ${usageItemStyles};
    flex: 1;
    min-width: 0;

    > :first-child {
        flex-shrink: 0;
    }

    > span:not(:first-child) {
        flex: 1;
    }
`;
