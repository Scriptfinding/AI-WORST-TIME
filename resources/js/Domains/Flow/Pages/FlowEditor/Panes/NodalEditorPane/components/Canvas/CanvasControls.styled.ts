import styled from 'styled-components';

export const CanvasControls = styled.div`
    position: absolute;
    left: 16px;
    bottom: 16px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.sm};
    z-index: 16;
`;

export const CanvasControlButton = styled.button`
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        color: ${({ theme }) => theme.colors.text.tertiary};
        cursor: not-allowed;
        opacity: 0.45;
    }

    &:disabled:hover {
        background: transparent;
    }
`;

export const ZoomValue = styled.span`
    min-width: 44px;
    text-align: center;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const SelectedCount = styled.span`
    min-width: 72px;
    margin-left: 4px;
    padding-left: 8px;
    border-left: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
`;

export const SelectionToolbar = styled.div`
    position: absolute;
    right: 16px;
    top: 16px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.sm};
    z-index: 16;
`;

export const SelectionToolbarCount = styled.span`
    min-width: 72px;
    padding: 0 8px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
`;

export const AddButtonGroup = styled.div`
    position: absolute;
    right: 16px;
    bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 16;
`;

export const AddButton = styled.button<{ $secondary?: boolean }>`
    width: 46px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid ${({ $secondary, theme }) => $secondary ? theme.colors.border.default : `${theme.colors.accent.primary}66`};
    background: ${({ $secondary, theme }) => $secondary ? theme.colors.bg.secondary : theme.colors.accent.primary};
    color: ${({ $secondary, theme }) => $secondary ? theme.colors.text.secondary : 'white'};
    cursor: pointer;
    box-shadow: ${({ theme }) => theme.shadow.lg};

    &:hover {
        color: ${({ $secondary, theme }) => $secondary ? theme.colors.text.primary : 'white'};
        background: ${({ $secondary, theme }) => $secondary ? theme.colors.bg.hover : theme.colors.accent.primary};
    }

    svg {
        width: 22px;
        height: 22px;
    }
`;
