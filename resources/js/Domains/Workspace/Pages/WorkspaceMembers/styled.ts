import styled from 'styled-components';

export const Page = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding-bottom: 60px;
    min-width: 0;
    width: 100%;
`;

export const TopCards = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 24px;
    align-items: stretch;
    min-width: 0;
    width: 100%;

    @media (max-width: 768px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const ContentGrid = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
    min-width: 0;
    width: 100%;

    @media (max-width: 768px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;
