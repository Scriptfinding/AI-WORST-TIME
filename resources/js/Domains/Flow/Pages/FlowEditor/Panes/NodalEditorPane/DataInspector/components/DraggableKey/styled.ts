import styled from 'styled-components';

export const JsonKey = styled.span`
    color: ${({ theme }) => theme.colors.accent.primary};
    cursor: grab;
    border-radius: ${({ theme }) => theme.radius.sm};

    &:hover {
        background: ${({ theme }) => theme.colors.accent.primary}14;
    }
`;
