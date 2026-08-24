import styled from 'styled-components';
import { usageItemStyles } from './sharedStyled';

export const InlineItem = styled.div`
    ${usageItemStyles};
    gap: 6px;
    font-size: 12px;
    padding: 4px 0;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const InlineItemMeta = styled.code`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
