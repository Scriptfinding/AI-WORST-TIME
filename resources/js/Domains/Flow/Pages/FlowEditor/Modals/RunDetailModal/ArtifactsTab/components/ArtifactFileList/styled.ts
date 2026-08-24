import styled from 'styled-components';

export const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
`;

export const List = styled.div`
    display: flex;
    flex-direction: column;
`;
