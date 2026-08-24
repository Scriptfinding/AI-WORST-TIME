import styled from 'styled-components';

export const TwoColumns = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
    padding-bottom: 60px;
    min-width: 0;
    width: 100%;

    @media (max-width: 768px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const CardStack = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-width: 0;
`;

export const Card = styled.div`
    min-width: 0;
    max-width: 100%;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    padding: 20px 24px;
`;

export const WideCard = styled(Card)`
    grid-column: 1 / -1;
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
