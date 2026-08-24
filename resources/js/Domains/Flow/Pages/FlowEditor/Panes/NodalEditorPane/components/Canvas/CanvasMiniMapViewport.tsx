import type { Bounds, MiniMapProjection } from './utils';
import * as S from './CanvasMiniMapViewport.styled';

interface CanvasMiniMapViewportProps {
    bounds: Bounds;
    projection: MiniMapProjection;
}

export default function CanvasMiniMapViewport({
    bounds,
    projection,
}: CanvasMiniMapViewportProps) {
    const x = projection.toMiniX(bounds.minX);
    const y = projection.toMiniY(bounds.minY);
    const width = Math.max(4, projection.toMiniX(bounds.maxX) - x);
    const height = Math.max(4, projection.toMiniY(bounds.maxY) - y);

    return (
        <S.Viewport
            x={x}
            y={y}
            width={width}
            height={height}
            rx={4}
        />
    );
}
