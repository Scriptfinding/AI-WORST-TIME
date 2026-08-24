import styled from 'styled-components';

export const RunStatusIcon = styled.span<{ $variant: 'default' | 'success' | 'warning' | 'error' | 'info'; $spinning?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    background: ${({ theme, $variant }) =>
        $variant === 'success' ? theme.colors.accent.success + '10'
        : $variant === 'warning' ? theme.colors.accent.warning + '10'
        : $variant === 'error' ? theme.colors.accent.error + '10'
        : $variant === 'info' ? theme.colors.accent.info + '10'
        : theme.colors.bg.primary};
    border-radius: 50%;
    color: ${({ theme, $variant }) =>
        $variant === 'success' ? theme.colors.accent.success
        : $variant === 'warning' ? theme.colors.accent.warning
        : $variant === 'error' ? theme.colors.accent.error
        : $variant === 'info' ? theme.colors.accent.info
        : theme.colors.text.tertiary};

    svg {
        width: 14px;
        height: 14px;
        ${({ $spinning }) => $spinning && `animation: status-spin 1s linear infinite;`}
    }

    @keyframes status-spin {
        to { transform: rotate(360deg); }
    }
`;

export const RunDetailPanel = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    max-height: 100%;
`;

export const RunDetailPanelHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
`;

export const RunDetailPanelTitle = styled.div`
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    display: flex;
    align-items: center;
    gap: 5px;
`;

export const RunDetailCopyButton = styled.button`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.secondary};
    padding: 2px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const RunInputError = styled.div`
    margin-top: 8px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.accent.error};
`;

export const WaitingHumanIcon = styled.span`
    display: inline-flex;
    align-items: center;
    color: ${({ theme }) => theme.colors.accent.info};
    flex-shrink: 0;
`;
