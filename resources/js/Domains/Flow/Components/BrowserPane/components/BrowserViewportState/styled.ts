import styled, { keyframes } from 'styled-components';
import type { ConnectionStatus } from '@/Domains/Flow/Components/BrowserPane/hooks/useBrowserStream';

const spin = keyframes`
    to { transform: rotate(360deg); }
`;

export const Viewport = styled.div`
    flex: 1;
    min-height: 0;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
`;

export const Canvas = styled.canvas<{ $visible: boolean }>`
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    cursor: default;
    outline: none;
    display: ${({ $visible }) => $visible ? 'block' : 'none'};

    &:focus {
        outline: none;
    }
`;

export const Overlay = styled.div`
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    z-index: 2;
    background: #0a0a0a;
`;

export const OverlayIcon = styled.div<{ $status: ConnectionStatus }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    color: ${({ theme, $status }) =>
        $status === 'streaming' ? theme.colors.accent.success :
        $status === 'connecting' ? theme.colors.accent.info :
        $status === 'error' ? theme.colors.accent.error :
        theme.colors.text.tertiary};
    background: ${({ theme, $status }) =>
        $status === 'streaming' ? theme.colors.accent.success + '15' :
        $status === 'connecting' ? theme.colors.accent.info + '15' :
        $status === 'error' ? theme.colors.accent.error + '15' :
        theme.colors.bg.tertiary};

    .spin {
        animation: ${spin} 1s linear infinite;
    }
`;

export const OverlayText = styled.div`
    font-size: 13px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.white};
`;

export const OverlayHint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
    max-width: 260px;
    line-height: 1.5;
`;

export const RetryButton = styled.button`
    padding: 6px 16px;
    font-size: 12px;
    font-weight: 500;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.accent.primary};
    color: #fff;
    cursor: pointer;
    transition: opacity 0.15s;

    &:hover {
        opacity: 0.85;
    }
`;
