import styled from 'styled-components';

export const MobileBottomBar = styled.div`
    display: none;

    @media (max-width: 768px) {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 52px;
        background: ${({ theme }) => theme.colors.bg.secondary};
        border-top: 1px solid ${({ theme }) => theme.colors.border.default};
        z-index: 100;
    }
`;

export const MobileTab = styled.button<{ $active?: boolean }>`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    color: ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary : theme.colors.text.tertiary};
    transition: color ${({ theme }) => theme.transition.fast};
    cursor: pointer;

    svg {
        width: 18px;
        height: 18px;
    }

    &:active {
        color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const MobileTabLabel = styled.span`
    font-size: 10px;
    font-weight: 500;
    line-height: 1;
`;
