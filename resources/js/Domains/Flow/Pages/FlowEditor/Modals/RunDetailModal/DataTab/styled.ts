import styled from 'styled-components';

export const ErrorBanner = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    font-size: 12px;
    font-family: ${({ theme }) => theme.font.mono};
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.accent.error};
    background: ${({ theme }) => theme.colors.accent.error}0a;
    border: 1px solid ${({ theme }) => theme.colors.accent.error}30;
    border-radius: ${({ theme }) => theme.radius.md};
    white-space: pre-wrap;
    word-break: break-word;
    margin-top: 5px;

    svg {
        flex-shrink: 0;
        margin-top: 2px;
    }
`;

export const OutputHeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;

export const OutputFilterToggle = styled.button<{ $active: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: ${({ $active, theme }) => $active ? theme.colors.accent.primary : theme.colors.text.tertiary};
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme }) => theme.colors.accent.primary}10;
    }
`;

export const HiddenKeysHint = styled.button`
    display: flex;
    align-items: center;
    gap: 5px;
    width: 100%;
    padding: 5px 10px;
    font-size: 11px;
    font-family: ${({ theme }) => theme.font.mono};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px dashed ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    flex-shrink: 0;
    margin-top: 5px;
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme }) => theme.colors.accent.primary}08;
    }
`;

export const RunningStateContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex: 1;
    padding: 40px 20px;
`;

export const RunningSpinner = styled.div<{ $variant?: 'info' | 'warning' }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: ${({ theme, $variant }) =>
        $variant === 'warning' ? theme.colors.accent.warning : theme.colors.accent.info}12;
    color: ${({ theme, $variant }) =>
        $variant === 'warning' ? theme.colors.accent.warning : theme.colors.accent.info};

    svg {
        animation: running-spin 1s linear infinite;
    }

    @keyframes running-spin {
        to { transform: rotate(360deg); }
    }
`;

export const RunningText = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const RunningHint = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
    line-height: 1.5;
`;
