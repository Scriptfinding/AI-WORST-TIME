import styled from 'styled-components';

export const SidePanel = styled.aside<{ $hidden?: boolean; $mobileVisible?: boolean; $width?: number }>`
    width: ${({ $width = 540 }) => $width}px;
    min-width: 360px;
    max-width: min(860px, calc(100vw - 420px));
    background: ${({ theme }) => theme.colors.bg.secondary};
    overflow: hidden;
    display: ${({ $hidden }) => ($hidden ? 'none' : 'flex')};
    flex-direction: column;
    flex: 0 0 ${({ $width = 540 }) => $width}px;

    @media (max-width: 768px) {
        display: ${({ $mobileVisible }) => ($mobileVisible ? 'flex' : 'none')};
        width: 100%;
        min-width: 0;
        max-width: initial;
        border-left: none;
        flex: 1;
    }
`;

export const TabBar = styled.div`
    display: flex;
    flex-shrink: 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    overflow-x: auto;
    position: sticky;
    top: 0;
    z-index: 11;
    height: 41px;
    background: ${({ theme }) => theme.colors.bg.secondary};

    @media (max-width: 768px) {
        display: none;
    }
`;

export const Tab = styled.button<{ $active: boolean }>`
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: ${({ theme, $active }) =>
        $active ? theme.colors.text.primary : theme.colors.text.tertiary};
    border-bottom: 2px solid ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary : 'transparent'};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const TabLabelFull = styled.span`
    @media (max-width: 1100px) {
        display: none;
    }
`;

export const TabLabelShort = styled.span`
    display: none;
    @media (max-width: 1100px) {
        display: inline;
    }
`;

export const InfoScrollPane = styled.div`
    overflow-y: auto;
    flex: 1;
    min-height: 0;
`;

export const SplitPane = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
`;

export const SplitPaneHalf = styled.div`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
`;

export const SplitPaneDivider = styled.div`
    height: 1px;
    flex-shrink: 0;
    background: ${({ theme }) => theme.colors.border.default};
`;
