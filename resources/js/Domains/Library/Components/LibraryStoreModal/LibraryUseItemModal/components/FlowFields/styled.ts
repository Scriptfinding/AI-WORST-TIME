import styled from 'styled-components';

export const Fields = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;

    @media (max-width: 680px) {
        grid-template-columns: 1fr;
    }
`;
