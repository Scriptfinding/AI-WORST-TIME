import styled from 'styled-components';

export const UsageBadgeHintPopover = styled.div`
    display: none;
    position: fixed;
    white-space: nowrap;
    padding: 4px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    gap: 4px;
    z-index: 9999;
    align-items: center;
`;

export const UsageBadgeHintDot = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.bg.hover};
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 9px;
    font-weight: 700;
    cursor: default;
`;

export const UsageBadgeHintWrap = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    flex-shrink: 0;

    &:hover ${UsageBadgeHintPopover} {
        display: inline-flex;
    }
`;
