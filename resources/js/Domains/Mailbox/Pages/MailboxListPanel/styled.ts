import styled from 'styled-components';

export const PanelContextBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    height: 46px;
    min-height: 46px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
    gap: 8px;
`;

export const PanelContextText = styled.span`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const PanelContextMeta = styled.span`
    flex-shrink: 0;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
