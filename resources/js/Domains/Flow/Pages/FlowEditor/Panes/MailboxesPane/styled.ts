import styled from 'styled-components';

export const InlineLink = styled.a`
    color: ${({ theme }) => theme.colors.accent.primary};
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;
