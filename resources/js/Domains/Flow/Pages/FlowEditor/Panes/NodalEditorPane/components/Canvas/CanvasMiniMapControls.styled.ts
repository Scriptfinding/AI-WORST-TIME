import styled from 'styled-components';

export const Controls = styled.div<{ $fading?: boolean }>`
    position: absolute;
    top: 16px;
    left: 16px;
    width: 180px;
    height: 120px;
    overflow: hidden;
    border-radius: ${({ theme }) => theme.radius.lg};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.mode === 'dark'
        ? 'rgba(22, 22, 28, 0.88)'
        : 'rgba(255, 255, 255, 0.88)'};
    box-shadow: ${({ theme }) => theme.shadow.md};
    backdrop-filter: blur(10px);
    cursor: grab;
    z-index: 16;
    touch-action: none;
    opacity: ${({ $fading }) => $fading ? 0 : 1};
    transform: translateY(${({ $fading }) => $fading ? '-4px' : '0'});
    transition:
        opacity 220ms ease,
        transform 220ms ease;
    pointer-events: ${({ $fading }) => $fading ? 'none' : 'auto'};

    &:active {
        cursor: grabbing;
    }
`;
