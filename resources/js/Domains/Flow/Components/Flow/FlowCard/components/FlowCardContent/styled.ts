import styled from 'styled-components';

export const Description = styled.p`
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    line-height: 1.45;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
`;
