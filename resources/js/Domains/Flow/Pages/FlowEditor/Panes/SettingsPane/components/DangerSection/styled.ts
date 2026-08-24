import styled from 'styled-components';

export const DangerZone = styled.div`
    margin-top: 20px;
    padding: 14px;
    border: 1px solid ${({ theme }) => theme.colors.accent.error}40;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.errorBg};
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const DangerZoneTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.accent.error};
`;

export const DangerZoneDescription = styled.div`
    font-size: 11px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text.secondary};
    margin-bottom: 2px;
`;
