import styled from 'styled-components';

export const TableActions = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 6px;
    position: relative;
`;

export const OverflowWrapper = styled.div`
    position: relative;
`;

export const OverflowButton = styled.button`
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.tertiary};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

/**
 * Rendered with position: fixed (anchored to the trigger's bounding rect at
 * open time) so it is never clipped by the scrollable table wrapper.
 */
export const OverflowMenu = styled.div`
    position: fixed;
    z-index: 1000;
    min-width: 120px;
    padding: 4px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.md};
`;

export const OverflowMenuItem = styled.button<{ $danger?: boolean }>`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    font-size: 12px;
    white-space: nowrap;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ $danger, theme }) => $danger ? theme.colors.accent.error : theme.colors.text.secondary};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ $danger, theme }) => $danger ? theme.colors.accent.errorBg : theme.colors.bg.hover};
        color: ${({ $danger, theme }) => $danger ? theme.colors.accent.error : theme.colors.text.primary};
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        &:hover { background: transparent; }
    }
`;
