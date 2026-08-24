import styled from 'styled-components';

export const Status = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => `${theme.colors.accent.error}12`};
    color: ${({ theme }) => theme.colors.accent.error};
    font-size: 12px;
`;
