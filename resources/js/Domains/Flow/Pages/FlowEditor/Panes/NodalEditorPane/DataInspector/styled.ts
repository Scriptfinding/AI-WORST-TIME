import styled from 'styled-components';

export const InspectorPanel = styled.div`
    align-self: stretch;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-radius: ${({ theme }) => theme.radius.lg};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    overflow: hidden;
`;

export const InspectorBody = styled.div`
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

export const InspectorEmpty = styled.div`
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px;
    text-align: center;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const InspectorJsonTree = styled.div`
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 8px 0;
    min-width: 100%;
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    line-height: 1.55;
    overscroll-behavior: contain;
    white-space: nowrap;
`;
