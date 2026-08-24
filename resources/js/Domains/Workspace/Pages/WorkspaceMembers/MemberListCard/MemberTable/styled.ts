import styled from 'styled-components';

export const EmptyCell = styled.td`
    text-align: center;
    padding: 24px 14px !important;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;
