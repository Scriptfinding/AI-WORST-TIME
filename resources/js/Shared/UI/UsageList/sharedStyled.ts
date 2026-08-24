import styled, { css } from 'styled-components';

export const usageItemStyles = css`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const UsageItemName = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
`;
