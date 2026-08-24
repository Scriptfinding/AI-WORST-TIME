import styled from 'styled-components';

export const Warning = styled.div`
    display: flex;
    gap: 12px;
    padding: 14px;
    background: ${({ theme }) => theme.colors.accent.errorBg};
    border: 1px solid ${({ theme }) => theme.colors.accent.error}33;
    border-radius: ${({ theme }) => theme.radius.md};
`;

export const WarningIcon = styled.div`
    color: ${({ theme }) => theme.colors.accent.error};
    flex-shrink: 0;
    margin-top: 1px;
`;

export const Message = styled.p`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
    line-height: 1.5;
    margin: 0;
`;
