import type React from 'react';
import type { CanvasEdge, CanvasNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import CanvasMiniMapControls from './CanvasMiniMapControls';
import CanvasMiniMapNodes from './CanvasMiniMapNodes';
import CanvasMiniMapViewport from './CanvasMiniMapViewport';
import useCanvasMiniMap from './useCanvasMiniMap';
import {
    MINI_MAP_HEIGHT,
    MINI_MAP_WIDTH,
} from './utils';
import * as S from './CanvasMiniMap.styled';

interface CanvasMiniMapProps {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    canvasRef: React.RefObject<HTMLDivElement | null>;
    viewport: { x: number; y: number; zoom: number };
    setViewport: React.Dispatch<React.SetStateAction<{ x: number; y: number; zoom: number }>>;
    fading?: boolean;
}

export default function CanvasMiniMap({
    nodes,
    edges,
    canvasRef,
    viewport,
    setViewport,
    fading,
}: CanvasMiniMapProps) {
    const {
        projection,
        viewportWorldBounds,
        moveViewportTo,
    } = useCanvasMiniMap({ nodes, canvasRef, viewport, setViewport });

    if (!projection || !viewportWorldBounds || nodes.length === 0) return null;

    return (
        <CanvasMiniMapControls fading={fading} onNavigate={moveViewportTo}>
            <S.Svg
                width={MINI_MAP_WIDTH}
                height={MINI_MAP_HEIGHT}
                viewBox={`0 0 ${MINI_MAP_WIDTH} ${MINI_MAP_HEIGHT}`}
            >
                <CanvasMiniMapNodes
                    nodes={nodes}
                    edges={edges}
                    projection={projection}
                />
                <CanvasMiniMapViewport
                    bounds={viewportWorldBounds}
                    projection={projection}
                />
            </S.Svg>
        </CanvasMiniMapControls>
    );
}
