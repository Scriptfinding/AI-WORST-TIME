import styled from 'styled-components';

export const ImportForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const Status = styled.div<{ $error?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme, $error }) => $error ? `${theme.colors.accent.error}12` : theme.colors.bg.tertiary};
    color: ${({ theme, $error }) => $error ? theme.colors.accent.error : theme.colors.text.secondary};
    font-size: 12px;
`;

export const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
`;
