import styled from 'styled-components';

export const Rows = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    padding-bottom: 60px;
    min-width: 0;
    width: 100%;
`;

export const TopGrid = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    align-items: start;
    min-width: 0;
    width: 100%;
`;

export const ConnectionModeGrid = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
    gap: 24px;
    align-items: stretch;
    min-width: 0;
    width: 100%;

    > * {
        height: 100%;
    }

    @media (max-width: 1100px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;
