import styled from 'styled-components';

export const TimelineWrapper = styled.div`
    flex: 1;
    position: relative;
    height: 16px;
    margin: 0 6px;
    cursor: pointer;
`;

export const TimelineTrack = styled.div`
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 4px;
    transform: translateY(-50%);
    border-radius: 2px;
    background: ${({ theme }) => theme.colors.brand};
    opacity: 0.25;
`;

export const TimelineProgress = styled.div<{ $pct: number }>`
    position: absolute;
    top: 50%;
    left: 0;
    height: 4px;
    transform: translateY(-50%);
    width: ${({ $pct }) => $pct}%;
    border-radius: 2px;
    background: ${({ theme }) => theme.colors.brand};
    pointer-events: none;
    z-index: 1;
`;
