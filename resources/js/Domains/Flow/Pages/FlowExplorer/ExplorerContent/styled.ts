import styled from 'styled-components';

export const Container = styled.div`
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    padding: 24px;

    @media (max-width: 768px) {
        padding: 16px;
    }
`;
