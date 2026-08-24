import styled from 'styled-components';

export const Results = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
`;

export const Card = styled.div<{ $valid: boolean }>`
    padding: 14px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ $valid, theme }) =>
        $valid ? theme.colors.accent.successBg : theme.colors.accent.errorBg};
    border: 1px solid ${({ $valid }) =>
        $valid ? '#22c55e25' : '#ef444425'};
`;

export const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
`;

export const StatusIcon = styled.span<{ $valid: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ $valid }) => $valid ? '#22c55e' : '#ef4444'};
    color: white;
    font-size: 12px;
    font-weight: 700;
`;

export const Title = styled.span<{ $valid: boolean }>`
    font-size: 13px;
    font-weight: 600;
    color: ${({ $valid }) => $valid ? '#22c55e' : '#ef4444'};
`;

export const DetailRow = styled.div`
    display: flex;
    gap: 8px;
    font-size: 12px;
    margin-left: 30px;
    margin-bottom: 2px;
`;

export const DetailLabel = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    min-width: 70px;
`;

export const DetailValue = styled.span`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-family: ${({ theme }) => theme.font.mono};
    word-break: break-all;
`;
