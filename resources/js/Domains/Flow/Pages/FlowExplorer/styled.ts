import styled from 'styled-components';

export const ExplorerLayout = styled.div`
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
`;

export const SidebarResizeHandle = styled.div`
    width: 2px;
    flex-shrink: 0;
    position: relative;
    z-index: 20;
    cursor: col-resize;
    background: ${({ theme }) => theme.colors.border.default};
    transition: background ${({ theme }) => theme.transition.fast};

    &::before {
        content: '';
        position: absolute;
        inset: 0 -5px;
    }

    &:hover,
    &:active {
        background: ${({ theme }) => theme.colors.accent.primary};
    }

    @media (max-width: 768px) {
        display: none;
    }
`;

export const HeaderActions = styled.div`
    display: flex;
    gap: 8px;
`;

export const BtnLabel = styled.span`
    @media (max-width: 768px) {
        display: none;
    }
`;
