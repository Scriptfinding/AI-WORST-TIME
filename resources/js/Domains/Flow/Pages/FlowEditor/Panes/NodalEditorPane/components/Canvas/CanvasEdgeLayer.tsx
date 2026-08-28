import {
    DEFAULT_INPUT_PORT,
    DEFAULT_OUTPUT_PORT,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import {
    getEdgePath,
    getEdgeMidpoint,
    getPendingEdgePath,
    getKnifePath,
    getPortPosition,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/geometry';
import type {
    CanvasEdge,
    CanvasNode,
    ConnectionDragState,
    KnifeDragState,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { EdgeDropTarget } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/edges';
import * as S from './CanvasEdgeLayer.styled';

interface CanvasEdgeLayerProps {
    edges: CanvasEdge[];
    nodes: CanvasNode[];
    connectionDrag: ConnectionDragState | null;
    knifeDrag: KnifeDragState | null;
    edgeDropTarget: EdgeDropTarget | null;
    runProgress?: {
        passedEdgeIds: Set<string>;
        edgePassCounts: Map<string, number>;
    } | null;
}

export default function CanvasEdgeLayer({
    edges,
    nodes,
    connectionDrag,
    knifeDrag,
    edgeDropTarget,
    runProgress,
}: CanvasEdgeLayerProps) {
    return (
        <S.EdgeLayer>
            {edges.map(edge => {
                const sourceNode = nodes.find(node => node.id === edge.sourceNodeId);
                const targetNode = nodes.find(node => node.id === edge.targetNodeId);
                if (!sourceNode || !targetNode) return null;
                const runPassed = runProgress?.passedEdgeIds.has(edge.id) ?? false;
                const start = getPortPosition(sourceNode, edge.sourcePort ?? DEFAULT_OUTPUT_PORT, 'output');
                const end = getPortPosition(targetNode, edge.targetPort ?? DEFAULT_INPUT_PORT, 'input');
                const midpoint = getEdgeMidpoint(start, end);
                const passCount = runPassed ? runProgress?.edgePassCounts.get(edge.id) ?? 0 : 0;
                const showPassCount = passCount >= 2;

                return (
                    <g key={edge.id}>
                        <S.EdgePath
                            $active={edgeDropTarget?.edgeId === edge.id}
                            $runPassed={runPassed}
                            d={getEdgePath(start, end)}
                        />
                        {showPassCount && (
                            <S.EdgeRunCountBadge transform={`translate(${midpoint.x} ${midpoint.y})`}>
                                <circle r="11" />
                                <text y="1">{passCount}</text>
                            </S.EdgeRunCountBadge>
                        )}
                    </g>
                );
            })}
            {connectionDrag && (
                <S.PendingEdgePath
                    d={getPendingEdgePath(
                        { x: connectionDrag.startX, y: connectionDrag.startY },
                        { x: connectionDrag.currentX, y: connectionDrag.currentY },
                        connectionDrag.fromSide,
                    )}
                />
            )}
            {knifeDrag && knifeDrag.points.length > 0 && (
                <S.KnifePath d={getKnifePath(knifeDrag.points)} />
            )}
        </S.EdgeLayer>
    );
}
