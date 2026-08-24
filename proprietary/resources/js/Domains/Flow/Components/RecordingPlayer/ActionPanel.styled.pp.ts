import styled from 'styled-components';

export const ResizeHandle = styled.div`
    width: 2px;
    cursor: col-resize;
    flex-shrink: 0;
    position: relative;
    z-index: 10;
    background: ${({ theme }) => theme.colors.bg.secondary};

    &::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 2px;
        background: ${({ theme }) => theme.colors.border.default};
        transition: background 150ms ease;
    }

    &:hover::after,
    &:active::after {
        background: ${({ theme }) => theme.colors.accent.primary};
        border-radius: 2px;
    }

    @media (max-width: 768px) {
        display: none;
    }
`;

export const Panel = styled.div`
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-left: 1px solid ${({ theme }) => theme.colors.border.default};

    @media (max-width: 768px) {
        width: 100% !important;
        flex: 1;
        min-height: 0;
        border-left: none;
        border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    }
`;

export const ActionPanelHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    font-size: 11px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
    text-transform: uppercase;
    letter-spacing: 0.4px;
`;

export const PanelCloseButton = styled.button`
    margin-left: auto;
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    border-radius: 4px;
    line-height: 0;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const ActionCount = styled.span`
    font-size: 10px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border-radius: 8px;
    padding: 0 5px;
    line-height: 16px;
`;

export const ActionList = styled.div`
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-bottom: 8px;
`;
