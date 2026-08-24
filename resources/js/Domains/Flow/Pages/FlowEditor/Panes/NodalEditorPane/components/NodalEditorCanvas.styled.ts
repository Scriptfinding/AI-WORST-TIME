import styled from 'styled-components';
import { CANVAS_GRID_SIZE } from '../utils/grid';

const CANVAS_DOT_SPACING = CANVAS_GRID_SIZE;
const CANVAS_DOT_RADIUS = 1.35;
const CANVAS_STRIPE_WIDTH = CANVAS_GRID_SIZE * 0.3;

export const Canvas = styled.div<{
    $knifeActive?: boolean;
    $readOnly?: boolean;
    $viewportX: number;
    $viewportY: number;
    $zoom: number;
}>`
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background-color: ${({ $readOnly, theme }) => $readOnly
        ? (theme.mode === 'dark' ? '#15151a' : theme.colors.bg.tertiary)
        : theme.colors.bg.primary};
    background-image: ${({ $readOnly, $zoom, theme }) => $readOnly
        ? `repeating-linear-gradient(
            135deg,
            transparent 0 ${CANVAS_STRIPE_WIDTH}px,
            ${theme.colors.border.default}22 ${CANVAS_STRIPE_WIDTH}px ${CANVAS_STRIPE_WIDTH * 2}px
        )`
        : `radial-gradient(
            circle,
            ${theme.colors.border.default} ${CANVAS_DOT_RADIUS * $zoom}px,
            transparent ${CANVAS_DOT_RADIUS * $zoom}px
        )`};
    background-position: ${({ $readOnly, $viewportX, $viewportY }) => $readOnly
        ? '0 0'
        : `${$viewportX}px ${$viewportY}px`};
    background-size: ${({ $readOnly, $zoom }) => $readOnly
        ? 'auto'
        : `${CANVAS_DOT_SPACING * $zoom}px ${CANVAS_DOT_SPACING * $zoom}px`};
    cursor: ${({ $knifeActive }) => $knifeActive
        ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M4 20 20 4M14 4l6 6M11 7l6 6\' stroke=\'black\' stroke-width=\'2\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E") 4 20, crosshair'
        : 'crosshair'};
    &:active {
        cursor: crosshair;
    }
    user-select: none;
    overscroll-behavior: contain;
    touch-action: none;
`;

export const CanvasViewport = styled.div<{ $x: number; $y: number; $zoom: number }>`
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    transform: translate(${({ $x }) => $x}px, ${({ $y }) => $y}px) scale(${({ $zoom }) => $zoom});
    transform-origin: 0 0;
    isolation: isolate;
`;
