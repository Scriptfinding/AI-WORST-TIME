import styled from 'styled-components';

export const BlueprintBadge = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.text.tertiary};

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;
