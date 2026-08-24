import styled from 'styled-components';

export const Viewport = styled.rect`
    fill: ${({ theme }) => theme.colors.text.secondary}18;
    stroke: ${({ theme }) => theme.colors.text.secondary}45;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
`;
