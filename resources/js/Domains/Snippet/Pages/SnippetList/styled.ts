import styled from 'styled-components';

const PANEL_CONTEXT_HEIGHT = '46px';

export const PanelContextBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    height: ${PANEL_CONTEXT_HEIGHT};
    min-height: ${PANEL_CONTEXT_HEIGHT};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
    gap: 8px;

    @media (max-width: 768px) {
        padding: 0 10px;
        gap: 6px;
    }
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
