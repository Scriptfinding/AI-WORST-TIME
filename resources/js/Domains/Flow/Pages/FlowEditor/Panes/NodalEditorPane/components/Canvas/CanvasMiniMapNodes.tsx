import type { CanvasEdge, CanvasNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import {
    MINI_MAP_NODE_SIZE,
    getMiniMapEdgePath,
    getMiniMapNodeCenter,
    nodeBounds,
} from './utils';
import type { MiniMapProjection } from './utils';
import * as S from './CanvasMiniMapNodes.styled';

interface CanvasMiniMapNodesProps {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    projection: MiniMapProjection;
}

export default function CanvasMiniMapNodes({
    nodes,
    edges,
    projection,
}: CanvasMiniMapNodesProps) {
    const nodeById = new Map(nodes.map(node => [node.id, node]));

    return (
        <>
            {edges.map(edge => {
                const sourceNode = nodeById.get(edge.sourceNodeId);
                const targetNode = nodeById.get(edge.targetNodeId);
                if (!sourceNode || !targetNode) return null;

                return (
                    <S.Edge
                        key={edge.id}
                        d={getMiniMapEdgePath(
                            getMiniMapNodeCenter(sourceNode, projection),
                            getMiniMapNodeCenter(targetNode, projection),
                        )}
                    />
                );
            })}
            {nodes.map(node => {
                const bounds = nodeBounds(node);
                const center = getMiniMapNodeCenter(node, projection);
                const rawWidth = Math.max(3, (bounds.maxX - bounds.minX) * projection.scale);
                const rawHeight = Math.max(3, (bounds.maxY - bounds.minY) * projection.scale);
                const width = node.kind === 'stickyNote' ? rawWidth : MINI_MAP_NODE_SIZE;
                const height = node.kind === 'stickyNote' ? rawHeight : MINI_MAP_NODE_SIZE;

                return (
                    <S.Node
                        key={node.id}
                        x={center.x - width / 2}
                        y={center.y - height / 2}
                        width={width}
                        height={height}
                        rx={node.system ? 3 : 2}
                        data-system={node.system ? 'true' : undefined}
                        data-sticky-note={node.kind === 'stickyNote' ? 'true' : undefined}
                    />
                );
            })}
        </>
    );
}
