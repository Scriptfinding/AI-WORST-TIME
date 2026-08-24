import styled from 'styled-components';

export const Section = styled.section`
    margin-bottom: 32px;
`;

export const SectionTitle = styled.h2`
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 12px;
`;

export const FlowList = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
`;
