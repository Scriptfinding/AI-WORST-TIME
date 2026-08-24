import styled from 'styled-components';

export const HeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const Container = styled.div`
    display: flex;
    overflow: hidden;
    flex: 1;
`;

export const HeaderButtonLabel = styled.span`
    @media (max-width: 520px) {
        display: none;
    }
`;
