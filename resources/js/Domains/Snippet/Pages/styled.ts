import styled from 'styled-components';

export const HeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const Container = styled.div`
    display: flex;
    overflow: hidden;
    flex: 1;

    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

export const HeaderButtonLabel = styled.span`
    @media (max-width: 520px) {
        display: none;
    }
`;

export const MobileBottomBar = styled.div`
    display: none;

    @media (max-width: 768px) {
        display: flex;
        height: 52px;
        min-height: 52px;
        flex-shrink: 0;
        background: ${({ theme }) => theme.colors.bg.secondary};
        border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    }
`;

export const MobileTab = styled.button<{ $active?: boolean }>`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border: none;
    background: none;
    color: ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary : theme.colors.text.tertiary};
    transition: color ${({ theme }) => theme.transition.fast};
    cursor: pointer;
    svg { width: 18px; height: 18px; }
    &:active { color: ${({ theme }) => theme.colors.accent.primary}; }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
`;

export const MobileTabLabel = styled.span`
    font-size: 10px;
    font-weight: 500;
    line-height: 1;
`;

