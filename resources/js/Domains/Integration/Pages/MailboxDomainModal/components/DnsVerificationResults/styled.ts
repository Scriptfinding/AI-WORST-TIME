import styled from 'styled-components';

export const Results = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 12px;
`;

export const Card = styled.div<{ $valid: boolean }>`
    padding: 12px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ $valid, theme }) => $valid ? theme.colors.accent.successBg : theme.colors.accent.errorBg};
    border: 1px solid ${({ $valid }) => $valid ? '#22c55e20' : '#ef444420'};
`;

export const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 8px;
`;

export const StatusDot = styled.span<{ $valid: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ $valid }) => $valid ? '#22c55e' : '#ef4444'};
    color: white;
    font-size: 10px;
    font-weight: 700;
`;

export const Label = styled.span<{ $valid: boolean }>`
    font-size: 12px;
    font-weight: 600;
    color: ${({ $valid }) => $valid ? '#22c55e' : '#ef4444'};
`;

export const Detail = styled.div`
    margin-left: 25px;
`;

export const DetailRow = styled.div`
    display: flex;
    gap: 6px;
    font-size: 11px;
    margin-bottom: 1px;
`;

export const DetailKey = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    min-width: 60px;
`;

export const DetailValue = styled.span`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-family: ${({ theme }) => theme.font.mono};
    word-break: break-all;
    font-size: 11px;
`;
