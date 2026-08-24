import styled from 'styled-components';

export const EdgeLayer = styled.svg`
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    overflow: visible;
    pointer-events: none;
    z-index: 1;
`;

export const EdgePath = styled.path<{ $active?: boolean; $runPassed?: boolean }>`
    fill: none;
    stroke: ${({ $active, $runPassed, theme }) => ($active || $runPassed) ? '#22c55e' : theme.colors.border.light};
    stroke-width: ${({ $active, $runPassed }) => ($active || $runPassed) ? 4 : 2};
    stroke-linecap: round;
    filter: ${({ $active, $runPassed }) => ($active || $runPassed) ? 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.45))' : 'none'};
    transition:
        stroke ${({ theme }) => theme.transition.fast},
        stroke-width ${({ theme }) => theme.transition.fast},
        filter ${({ theme }) => theme.transition.fast};
`;

export const PendingEdgePath = styled(EdgePath)`
    stroke-dasharray: 6 5;
    opacity: 0.8;
`;

export const EdgeRunCountBadge = styled.g`
    pointer-events: none;

    circle {
        fill: ${({ theme }) => theme.mode === 'dark' ? theme.colors.bg.secondary : '#ffffff'};
        stroke: #22c55e;
        stroke-width: 2.5;
        filter: drop-shadow(0 2px 5px rgba(15, 23, 42, 0.25));
    }

    text {
        fill: #22c55e;
        font-size: 11px;
        font-weight: 700;
        text-anchor: middle;
        dominant-baseline: middle;
        font-family: system-ui, sans-serif;
    }
`;

export const KnifePath = styled.path`
    fill: none;
    stroke: ${({ theme }) => theme.colors.accent.primary};
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 7 4;
    pointer-events: none;
`;
