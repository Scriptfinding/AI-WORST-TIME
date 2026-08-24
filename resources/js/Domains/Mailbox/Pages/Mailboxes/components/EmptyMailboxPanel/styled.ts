import styled from 'styled-components';

const HEADER_HEIGHT = '46px';

export const Panel = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
    border-right: 1px solid ${({ theme }) => theme.colors.border.default};

    @media (max-width: 768px) {
        min-width: 0;
        border-right: none;
    }
`;

export const PanelHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: ${HEADER_HEIGHT};
    min-height: ${HEADER_HEIGHT};
    padding: 0 14px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
    gap: 8px;
`;

export const PanelTitle = styled.h2`
    margin: 0;
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const PanelBody = styled.div`
    flex: 1;
    overflow-y: auto;
`;

export const EmptyState = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 24px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
    text-align: center;
`;
