import styled from 'styled-components';

export const Edge = styled.path`
    fill: none;
    stroke: ${({ theme }) => theme.mode === 'dark' ? '#71717a' : '#9ca3af'};
    stroke-width: 1;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.8;
`;

export const Node = styled.rect`
    fill: ${({ theme }) => theme.mode === 'dark' ? '#27272a' : '#e5e7eb'};
    stroke: ${({ theme }) => theme.mode === 'dark' ? '#3f3f46' : '#d1d5db'};
    stroke-width: 1;

    &[data-system='true'] {
        fill: ${({ theme }) => theme.mode === 'dark' ? '#3f3f46' : '#e2e8f0'};
        stroke: ${({ theme }) => theme.mode === 'dark' ? '#71717a' : '#cbd5e1'};
    }

    &[data-sticky-note='true'] {
        fill: ${({ theme }) => theme.mode === 'dark' ? '#44403c' : '#f5f5f4'};
        stroke: ${({ theme }) => theme.mode === 'dark' ? '#78716c' : '#d6d3d1'};
    }
`;
