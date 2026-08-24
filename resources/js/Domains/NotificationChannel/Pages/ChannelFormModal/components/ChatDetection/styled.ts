import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const Result = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 12px;
    font-weight: 500;
    background: ${({ theme }) => theme.colors.accent.error}15;
    color: ${({ theme }) => theme.colors.accent.error};
`;

export const SelectLabel = styled.label`
    font-size: 13px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const Success = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.successBg};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 500;
`;
