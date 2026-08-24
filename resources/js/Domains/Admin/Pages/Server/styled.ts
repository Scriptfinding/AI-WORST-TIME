import styled from 'styled-components';

export const TabContent = styled.div`
    display: grid;
    gap: 16px;
    width: 100%;
    max-width: 760px;
    padding-bottom: 60px;
`;

export const FlashStack = styled.div`
    display: grid;
    gap: 8px;
    margin-bottom: 16px;
`;

export const Flash = styled.div<{ $variant: 'success' | 'error' }>`
    padding: 12px 14px;
    border: 1px solid ${({ $variant }) => $variant === 'success' ? 'rgba(22, 163, 74, 0.35)' : 'rgba(239, 68, 68, 0.35)'};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ $variant }) => $variant === 'success' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
    color: ${({ $variant }) => $variant === 'success' ? '#16a34a' : '#ef4444'};
    font-size: 13px;
    font-weight: 600;
`;
