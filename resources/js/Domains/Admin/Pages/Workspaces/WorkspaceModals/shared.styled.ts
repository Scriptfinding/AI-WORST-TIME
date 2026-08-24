import styled, { css } from 'styled-components';

export const ModalList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const modalItemStyles = css`
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
`;

export const ModalItemLabel = styled.div`
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    gap: 8px;

    > svg, > div:first-child, > span:first-child {
        flex-shrink: 0;
    }
`;

export const ModalItemName = styled.span`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const ModalEmptyState = styled.div`
    text-align: center;
    padding: 48px 20px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
`;
