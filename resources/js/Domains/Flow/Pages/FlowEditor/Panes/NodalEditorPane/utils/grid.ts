export const CANVAS_GRID_SIZE = 24;

export const snapCanvasPosition = (value: number) => Math.round(value / CANVAS_GRID_SIZE) * CANVAS_GRID_SIZE;

export const snapCanvasPoint = <T extends { x: number; y: number }>(point: T): T => ({
    ...point,
    x: snapCanvasPosition(point.x),
    y: snapCanvasPosition(point.y),
});
