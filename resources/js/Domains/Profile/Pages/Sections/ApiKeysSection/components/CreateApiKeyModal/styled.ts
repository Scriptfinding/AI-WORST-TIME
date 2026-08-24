import styled from 'styled-components';

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const Hint = styled.p`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin: 0;
`;
