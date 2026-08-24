import styled from 'styled-components';

export const Tabs = styled.div`
    display: flex;
    gap: 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    margin-bottom: 10px;
    flex-shrink: 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`;

export const Tab = styled.button<{ $active?: boolean }>`
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    color: ${({ theme, $active }) => $active ? theme.colors.text.primary : theme.colors.text.tertiary};
    border-bottom: 2px solid ${({ theme, $active }) => $active ? theme.colors.brand : 'transparent'};
    transition: all ${({ theme }) => theme.transition.fast};
    text-align: center;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const MobileOnlyTab = styled(Tab)`
    display: none;

    @media (max-width: 768px) {
        display: inline-flex;
    }
`;

export const LiveIndicator = styled.span`
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ef4444;
    animation: live-pulse 1.5s ease-in-out infinite;
    box-shadow: 0 0 4px #ef444480;
    margin-left: 2px;

    @keyframes live-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.7); }
    }
`;
