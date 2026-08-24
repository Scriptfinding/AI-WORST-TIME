import styled, { keyframes } from 'styled-components';
import type { ConnectionStatus } from '@/Domains/Flow/Components/BrowserPane/hooks/useBrowserStream';

const spin = keyframes`
    to { transform: rotate(360deg); }
`;

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
`;

export const Chrome = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 6px 8px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
`;

export const NavButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.12s, color 0.12s;

    &:hover:not(:disabled) {
        background: ${({ theme }) => theme.colors.bg.tertiary};
        color: ${({ theme }) => theme.colors.text.primary};
    }

    &:active:not(:disabled) {
        background: ${({ theme }) => theme.colors.border.default};
    }

    &:disabled {
        opacity: 0.3;
        cursor: default;
    }
`;

export const AddressBar = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    height: 28px;
    border-radius: 8px;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border: 1px solid transparent;
    padding: 0 8px;
    gap: 6px;
    margin: 0 4px;
    transition: border-color 0.15s, background 0.15s;

    &:focus-within {
        border-color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme }) => theme.colors.bg.secondary};
    }
`;

export const AddressBarIcon = styled.div`
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const AddressBarLabel = styled.span`
    flex: 1;
    min-width: 0;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const AddressBarInput = styled.input`
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    outline: none;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: ${({ theme }) => theme.colors.text.secondary};
    padding: 0;
    line-height: 1;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        color: ${({ theme }) => theme.colors.text.primary};
    }

    &:disabled {
        opacity: 0.5;
    }
`;

export const StatusChip = styled.div<{ $status: ConnectionStatus }>`
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    padding: 0 4px;
    color: ${({ theme, $status }) =>
        $status === 'streaming' ? theme.colors.accent.success :
        $status === 'connecting' ? theme.colors.accent.info :
        $status === 'error' ? theme.colors.accent.error :
        theme.colors.text.tertiary};

    .spin {
        animation: ${spin} 1s linear infinite;
    }
`;

export const RecordingBadge = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: #ef4444;
    background: #ef444418;
`;

export const LiveDotSmall = styled.div`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ef4444;
    animation: ${pulse} 1.5s ease-in-out infinite;
    box-shadow: 0 0 4px #ef444480;
`;
