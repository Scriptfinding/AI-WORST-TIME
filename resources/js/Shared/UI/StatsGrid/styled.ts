import styled from 'styled-components';

export const Grid = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 32px;

    @media (max-width: 768px) {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 500px) {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
    }
`;

export const StatCard = styled.div`
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 14px 16px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    min-width: 165px;
`;

export const StatIcon = styled.div<{ $fg: string; $round?: boolean }>`
    position: relative;
    width: 30px;
    height: 30px;
    border-radius: ${({ theme, $round }) => ($round ? '50%' : theme.radius.md)};
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ $fg }) => $fg}18;
    color: ${({ $fg }) => $fg};
    flex-shrink: 0;
`;

export const StatProgressRing = styled.svg`
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    /* Progress starts at 12 o'clock */
    transform: rotate(-90deg);
    pointer-events: none;

    circle {
        fill: none;
        stroke-width: 2.5;
    }

    .track {
        stroke: currentColor;
        opacity: 0.18;
    }

    .progress {
        stroke: currentColor;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.4s ease;
    }
`;

export const StatText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const StatLabel = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 500;
    white-space: nowrap;
`;

export const StatValue = styled.div`
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
    color: ${({ theme }) => theme.colors.text.primary};
    font-variant-numeric: tabular-nums;
`;
