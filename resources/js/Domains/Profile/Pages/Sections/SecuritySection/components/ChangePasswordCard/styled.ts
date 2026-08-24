import styled from 'styled-components';

export const Card = styled.div`
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: 20px 24px;
`;

export const CardTitle = styled.h2`
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const Separator = styled.hr`
    border: none;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    margin: 8px 0;
`;

export const PasswordHint = styled.p`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin: 0;
`;
