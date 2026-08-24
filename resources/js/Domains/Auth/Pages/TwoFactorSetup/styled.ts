import styled from 'styled-components';

export const SetupCard = styled.div`
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

export const ForcedBanner = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.accent.primary}40;
    background: ${({ theme }) => theme.colors.accent.primary}08;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.4;
`;
