import styled from 'styled-components';

export const NodeFieldHelp = styled.p`
    margin: 0;
    font-size: 11px;
    line-height: 1.45;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const NodeFieldError = styled.p`
    margin: 4px 0 0;
    font-size: 11px;
    line-height: 1.4;
    font-weight: 600;
    color: #ef4444;
`;
