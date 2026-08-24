import styled from 'styled-components';

export const WaitingHumanBanner = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    background: ${({ theme }) => theme.colors.accent.info}12;
    border: 1px solid ${({ theme }) => theme.colors.accent.info}40;
    border-radius: ${({ theme }) => theme.radius.md};
    margin: 0 0 8px 0;
    flex-shrink: 0;
`;

export const WaitingHumanText = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.accent.info};

    > svg {
        flex-shrink: 0;
        margin-top: 1px;
    }
`;

export const WaitingHumanCopy = styled.div`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
`;

export const WaitingHumanTitle = styled.div`
    font-weight: 600;
`;

export const WaitingHumanMessage = styled.div`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-weight: 400;
    line-height: 1.4;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
`;
