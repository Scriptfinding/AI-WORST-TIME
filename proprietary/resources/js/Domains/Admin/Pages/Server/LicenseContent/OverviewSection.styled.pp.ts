import styled from 'styled-components';

export const StatusGroup = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 10px;
`;

export const StatusBadge = styled.span<{ $active?: boolean }>`
    display: inline-flex;
    align-items: center;
    padding: 4px 9px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ $active }) => $active ? 'rgba(22, 163, 74, 0.12)' : 'rgba(245, 158, 11, 0.12)'};
    color: ${({ $active }) => $active ? '#16a34a' : '#f59e0b'};
    font-size: 12px;
    font-weight: 700;
`;

export const LicensePingButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;

    &:hover:not(:disabled) {
        border-color: ${({ theme }) => theme.colors.text.tertiary};
        color: ${({ theme }) => theme.colors.text.primary};
    }

    &:disabled {
        opacity: 0.6;
        cursor: default;
    }
`;
