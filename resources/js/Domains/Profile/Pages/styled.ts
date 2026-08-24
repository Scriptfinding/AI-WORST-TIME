import styled from 'styled-components';

export const Container = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
    padding-bottom: 60px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

export const SecurityContainer = styled(Container)`
    > :first-child {
        grid-column: 2;
        grid-row: 1;
    }

    > :nth-child(2) {
        grid-column: 1;
        grid-row: 1;
    }

    @media (max-width: 900px) {
        > :first-child {
            grid-column: auto;
            grid-row: auto;
            order: 2;
        }

        > :nth-child(2) {
            grid-column: auto;
            grid-row: auto;
            order: 1;
        }
    }
`;

export const ApiTab = styled.div`
    padding-bottom: 60px;
`;
