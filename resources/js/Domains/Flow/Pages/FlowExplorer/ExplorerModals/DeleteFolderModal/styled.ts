import styled from 'styled-components';

export const Body = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
    padding: 8px 0;
`;

export const Icon = styled.div`
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accent.error}12;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.accent.error};
`;

export const Title = styled.div`
    font-size: 15px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const Text = styled.div`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.5;
    max-width: 360px;
`;

export const Warning = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 14px;
    background: ${({ theme }) => theme.colors.accent.warning}10;
    border: 1px solid ${({ theme }) => theme.colors.accent.warning}30;
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 12px;
    color: ${({ theme }) => theme.colors.accent.warning};
    text-align: left;
    width: 100%;

    svg {
        flex-shrink: 0;
        margin-top: 1px;
    }
`;
