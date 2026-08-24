import styled from 'styled-components';

export const ErrorDetail = styled.p`
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text.secondary};
    word-break: break-word;
    white-space: pre-wrap;
`;
