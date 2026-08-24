import styled from 'styled-components';

export { ToolbarBadge } from '@/Shared/CodeEditor/shared/toolbar.styled';

export const Toolbar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    flex-shrink: 0;
    flex-wrap: wrap;
    gap: 6px;
`;

export const ToolbarLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
`;

export const ToolbarRight = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
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

export const FileName = styled.span`
    font-size: 12px;
    font-family: ${({ theme }) => theme.font.mono};
    color: ${({ theme }) => theme.colors.text.secondary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;

    @media (max-width: 768px) {
        display: none;
    }
`;

export const SavedIndicator = styled.span<{ $saved: boolean }>`
    font-size: 11px;
    white-space: nowrap;
    color: ${({ $saved, theme }) =>
        $saved ? theme.colors.accent.success : theme.colors.accent.warning};

    @media (max-width: 768px) {
        display: none;
    }
`;

export const ToolbarBadgeLabel = styled.span`
    line-height: 1;

    @media (max-width: 768px) {
        display: none;
    }
`;

export const SidePanelToggleWrap = styled.div`
    @media (max-width: 768px) {
        display: none;
    }
`;
