import styled from 'styled-components';

export const Wrapper = styled.div<{ $busy?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: 12px;
    opacity: ${({ $busy }) => $busy ? 0.55 : 1};
    pointer-events: ${({ $busy }) => $busy ? 'none' : 'auto'};
    transition: opacity 150ms ease;
`;
