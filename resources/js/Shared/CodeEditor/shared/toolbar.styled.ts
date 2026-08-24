import styled from 'styled-components';

export const ToolbarBadge = styled.button<{ $active?: boolean; $disabled?: boolean }>`
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};
    color: ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary : theme.colors.text.secondary};
    background: ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary + '18' : theme.colors.bg.primary};
    border: 1px solid ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary + '40' : theme.colors.border.default};
    opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
    pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};

    svg {
        width: 14px;
        height: 14px;
    }

    &:hover {
        background: ${({ theme }) => theme.colors.accent.primary}18;
        color: ${({ theme }) => theme.colors.accent.primary};
        border-color: ${({ theme }) => theme.colors.accent.primary}40;
    }

    &[data-tooltip]::before,
    &[data-tooltip]::after {
        position: absolute;
        left: 50%;
        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, 6px);
        transition: opacity ${({ theme }) => theme.transition.fast}, transform ${({ theme }) => theme.transition.fast};
        z-index: 20;
    }

    &[data-tooltip]::before {
        content: '';
        top: calc(100% + 5px);
        border: 5px solid transparent;
        border-bottom-color: ${({ theme }) => theme.colors.bg.elevated};
    }

    &[data-tooltip]::after {
        content: attr(data-tooltip);
        top: calc(100% + 14px);
        width: max-content;
        max-width: 220px;
        padding: 7px 9px;
        border-radius: ${({ theme }) => theme.radius.sm};
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.elevated};
        border: 1px solid ${({ theme }) => theme.colors.border.default};
        box-shadow: ${({ theme }) => theme.shadow.md};
        font-size: 11px;
        font-weight: 600;
        line-height: 1.2;
        white-space: nowrap;
    }

    &[data-tooltip-align='right']::before {
        right: 8px;
        left: auto;
        transform: translate(0, 6px);
    }

    &[data-tooltip-align='right']::after {
        right: 0;
        left: auto;
        transform: translate(0, 6px);
    }

    &[data-tooltip]:hover::before,
    &[data-tooltip]:hover::after,
    &[data-tooltip]:focus-visible::before,
    &[data-tooltip]:focus-visible::after {
        opacity: 1;
        transform: translate(-50%, 0);
    }

    &[data-tooltip-align='right']:hover::before,
    &[data-tooltip-align='right']:hover::after,
    &[data-tooltip-align='right']:focus-visible::before,
    &[data-tooltip-align='right']:focus-visible::after {
        transform: translate(0, 0);
    }
`;
