import styled from 'styled-components';

export const RunNowWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
`;

export const ClearAllButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: transparent;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    flex-shrink: 0;
    transition: color 0.12s, border-color 0.12s, background 0.12s;

    &:hover:not(:disabled) {
        color: ${({ theme }) => theme.colors.accent.error};
        border-color: ${({ theme }) => theme.colors.accent.error};
        background: ${({ theme }) => theme.colors.accent.error}10;
    }

    &:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .spin {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;

export const ClearSelectedButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    height: 30px;
    width: 30px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme }) => theme.colors.accent.defaultBg};
    background: ${({ theme }) => theme.colors.accent.defaultBg};
    color: ${({ theme }) => theme.colors.text.primary}55;
    cursor: pointer;
    font-weight: 500;
    white-space: nowrap;
    transition: background 0.12s, opacity 0.12s;

    &:hover {
        background: ${({ theme }) => theme.colors.accent.default}FF;
    }
`;

export const DeleteSelectedButton = styled.button`
    display: flex;
    align-items: center;
    gap: 5px;
    height: 30px;
    padding: 0 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme }) => theme.colors.accent.error};
    background: ${({ theme }) => theme.colors.accent.error}DD;
    color: ${({ theme }) => theme.colors.white};
    cursor: pointer;
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    transition: background 0.12s, opacity 0.12s;

    &:hover:not(:disabled) {
        background: ${({ theme }) => theme.colors.accent.error}FF;
    }

    &:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .spin {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;

export const RunList = styled.div<{ $dimmed?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: 4px;
    opacity: ${({ $dimmed }) => ($dimmed ? 0.4 : 1)};
    pointer-events: ${({ $dimmed }) => ($dimmed ? 'none' : 'auto')};
    transition: opacity 150ms ease;
`;

export const RunListLoadingWrap = styled.div`
    position: relative;
`;

export const RunListLoading = styled.div`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    color: ${({ theme }) => theme.colors.text.tertiary};

    svg {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
