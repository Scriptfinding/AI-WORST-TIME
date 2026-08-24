import styled from 'styled-components';

export const QrWrapper = styled.div`
    display: flex;
    justify-content: center;
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    align-self: center;

    svg {
        width: 192px;
        height: 192px;
    }
`;

export const SecretBox = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const SecretLabel = styled.span`
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const SecretValue = styled.code`
    padding: 8px 12px;
    font-size: 13px;
    font-family: ${({ theme }) => theme.font.mono};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.primary};
    word-break: break-all;
    letter-spacing: 2px;
    text-align: center;
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const Description = styled.p`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.5;
    margin: 0;
    text-align: center;
`;
