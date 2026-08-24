import styled from 'styled-components';

export const Controls = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
`;

export const ControlButton = styled.button`
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    border-radius: 4px;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const TimeLabel = styled.span`
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.colors.text.tertiary};
    user-select: none;
    white-space: nowrap;
    line-height: 16px;
`;

export const TimeToggle = styled.button`
    min-width: 6ch;
    padding: 0;
    border: none;
    background: none;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    text-align: right;
    user-select: none;
    white-space: nowrap;
    line-height: 16px;

    &:hover {
        color: ${({ theme }) => theme.colors.text.secondary};
    }
`;

export const DownloadLink = styled.a`
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    border-radius: 4px;
    text-decoration: none;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;
