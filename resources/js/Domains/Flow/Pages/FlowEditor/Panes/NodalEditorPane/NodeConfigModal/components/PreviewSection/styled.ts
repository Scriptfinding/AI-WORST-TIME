import styled from 'styled-components';

export const Pane = styled.div`
    min-height: 0;
    display: flex;
    flex-direction: column;

    > * {
        flex: 1;
        min-height: 0;
    }

    [data-inspector-key] {
        color: ${({ theme }) => theme.colors.accent.primary};

        &:hover {
            background: ${({ theme }) => theme.colors.bg.hover};
        }
    }
`;
