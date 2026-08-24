import styled, { keyframes } from 'styled-components';

export const Panel = styled.div<{ $width?: string; $mobileHidden?: boolean }>`
    display: flex;
    flex-direction: column;
    ${({ $width }) => $width ? `flex: 0 0 ${$width};` : 'flex: 1;'}
    border-right: 1px solid ${({ theme }) => theme.colors.border.default};
    overflow: hidden;

    @media (max-width: 1024px) {
        ${({ $width }) => $width ? 'flex: 0 1 260px; min-width: 200px;' : ''}
    }

    @media (max-width: 768px) {
        min-width: 0 !important;
        border-right: none;
        ${({ $mobileHidden }) => $mobileHidden ? 'display: none;' : 'flex: 1; min-height: 0;'}
    }
`;

const HEADER_HEIGHT = '46px';

export const PanelHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    height: ${HEADER_HEIGHT};
    min-height: ${HEADER_HEIGHT};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
    gap: 8px;

    @media (max-width: 768px) {
        padding: 0 10px;
        gap: 6px;
    }
`;

export const PanelHeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
`;

export const PanelHeaderRight = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
`;

export const PanelTitle = styled.h2`
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const PanelBody = styled.div`
    flex: 1;
    overflow-y: auto;
`;

export const EmptyPanel = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
    text-align: center;
    white-space: pre-wrap;
    padding: 32px;
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

export const PanelLoader = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
`;

export const PanelSpinner = styled.div`
    width: 22px;
    height: 22px;
    border: 2.5px solid ${({ theme }) => theme.colors.border.default};
    border-top-color: ${({ theme }) => theme.colors.accent.primary};
    border-radius: 50%;
    animation: ${spin} 0.6s linear infinite;
`;
