import styled from 'styled-components';

export const RecoveryCodes = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    padding: 16px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
`;

export const RecoveryCode = styled.code`
    font-size: 13px;
    font-family: ${({ theme }) => theme.font.mono};
    color: ${({ theme }) => theme.colors.text.primary};
    text-align: center;
    padding: 4px;
`;

export const RecoveryActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
`;
