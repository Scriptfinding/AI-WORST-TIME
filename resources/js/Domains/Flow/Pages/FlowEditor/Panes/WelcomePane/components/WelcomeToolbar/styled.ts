import styled from 'styled-components';

export const Toolbar = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    flex-shrink: 0;
`;

export const ViewToggle = styled.div`
    --view-toggle-border: ${({ theme }) => theme.colors.border.default};
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--view-toggle-border);
    border-radius: ${({ theme }) => theme.radius.sm};
    overflow: hidden;
    flex-shrink: 0;
`;

export const ViewToggleTab = styled.button<{ $active?: boolean }>`
    appearance: none;
    -webkit-appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px 7px;
    border: none;
    border-radius: 0;
    color: ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary : theme.colors.text.tertiary};
    background: ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary + '15' : 'transparent'};
    transition: color ${({ theme }) => theme.transition.fast}, background ${({ theme }) => theme.transition.fast};
    cursor: pointer;

    &:focus {
        outline: none;
    }

    &:focus-visible {
        box-shadow: inset 0 0 0 1px var(--view-toggle-border);
    }

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme }) => theme.colors.accent.primary}10;
    }

    & + & {
        border-left: 1px solid var(--view-toggle-border);
    }
`;

export const ToolbarLabel = styled.span`
    font-size: 12px;
    font-family: ${({ theme }) => theme.font.mono};
    color: ${({ theme }) => theme.colors.text.tertiary};
    flex: 1;
`;

export const SidePanelToggle = styled.button<{ $active?: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px 7px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary : theme.colors.text.tertiary};
    background: ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary + '15' : 'transparent'};
    transition: color ${({ theme }) => theme.transition.fast}, background ${({ theme }) => theme.transition.fast};
    cursor: pointer;
    margin-left: auto;

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme }) => theme.colors.accent.primary}10;
    }

    @media (max-width: 768px) {
        display: none;
    }
`;
