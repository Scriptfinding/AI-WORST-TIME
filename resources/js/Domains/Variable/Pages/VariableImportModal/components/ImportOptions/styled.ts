import styled from 'styled-components';

export const Fields = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;
