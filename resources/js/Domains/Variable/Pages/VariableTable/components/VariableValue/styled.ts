import styled from 'styled-components';

export const SecretDots = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    letter-spacing: 2px;
`;

export const JsonPreview = styled.code`
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const VaultRef = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.secondary};
`;
