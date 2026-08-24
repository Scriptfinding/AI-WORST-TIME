import styled from 'styled-components';

export const PanelHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
`;

export const PanelTitle = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
`;

export const CopyButton = styled.button`
    padding: 2px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 11px;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const Loader = styled.div`
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    min-height: 80px;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.text.tertiary};

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    svg { animation: spin 1s linear infinite; }
`;

export const ConsoleToggle = styled.button<{ $open?: boolean }>`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    font-size: 11px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme, $open }) => $open ? '0' : `0 0 ${theme.radius.md} ${theme.radius.md}`};
    border-top: none;
    cursor: pointer;
    user-select: none;
    flex-shrink: 0;
    transition: color ${({ theme }) => theme.transition.fast};

    svg {
        transition: transform ${({ theme }) => theme.transition.fast};
        transform: rotate(${({ $open }) => $open ? '90deg' : '0deg'});
    }

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const ConsoleResizeHandle = styled.div`
    height: 2px;
    cursor: ns-resize;
    background: ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
    transition: background ${({ theme }) => theme.transition.fast};

    &:hover,
    &:active {
        background: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const ConsolePanel = styled.div<{ $height: number }>`
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: ${({ $height }) => $height}px;
    max-height: 80%;
    min-height: 60px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-top: none;
    border-radius: 0 0 ${({ theme }) => theme.radius.md} ${({ theme }) => theme.radius.md};
    overflow: hidden;
`;

export const ConsolePanelContent = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    padding: 8px;
`;
