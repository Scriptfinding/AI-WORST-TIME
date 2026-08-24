import styled from 'styled-components';

export const SaveBeforeRunMessage = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    text-align: center;
`;

export const SaveBeforeRunIcon = styled.div`
    color: ${({ theme }) => theme.colors.accent.warning};
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accent.warning}12;
`;

export const SaveBeforeRunText = styled.p`
    font-size: 14px;
    color: ${({ theme }) => theme.colors.text.primary};
    line-height: 1.5;
    margin: 0;
`;

export const SaveBeforeRunHint = styled.p`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.4;
    margin: 0;
`;

export const SaveBeforeRunActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;
