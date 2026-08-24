import styled from 'styled-components';

export const SuccessTitle = styled.h3`
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
`;

export const SuccessHint = styled.p`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
    margin: 0;
    line-height: 1.4;
`;
