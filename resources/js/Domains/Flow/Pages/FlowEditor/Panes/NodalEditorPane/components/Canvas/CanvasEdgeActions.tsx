import { Icon } from '@/Shared/UI/Icon/Icon';
import {
    DEFAULT_INPUT_PORT,
    DEFAULT_OUTPUT_PORT,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import {
    getEdgeMidpoint,
    getPortPosition,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/geometry';
import type {
    CanvasEdge,
    CanvasNode,
    PendingEdgeInsertion,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import * as S from './CanvasEdgeActions.styled';

interface CanvasEdgeActionsProps {
    edges: CanvasEdge[];
    nodes: CanvasNode[];
    readOnly?: boolean;
    onInsertNode: (insertion: PendingEdgeInsertion) => void;
    onRemoveEdge: (edgeId: string) => void;
}

export default function CanvasEdgeActions({
    edges,
    nodes,
    readOnly,
    onInsertNode,
    onRemoveEdge,
}: CanvasEdgeActionsProps) {
    if (readOnly) return null;

    return (
        <>
            {edges.map(edge => {
                const sourceNode = nodes.find(node => node.id === edge.sourceNodeId);
                const targetNode = nodes.find(node => node.id === edge.targetNodeId);
                if (!sourceNode || !targetNode) return null;

                const midpoint = getEdgeMidpoint(
                    getPortPosition(sourceNode, edge.sourcePort ?? DEFAULT_OUTPUT_PORT, 'output'),
                    getPortPosition(targetNode, edge.targetPort ?? DEFAULT_INPUT_PORT, 'input'),
                );

                return (
                    <S.EdgeActionZone
                        key={`actions-${edge.id}`}
                        style={{ left: midpoint.x, top: midpoint.y }}
                        onPointerDown={event => event.stopPropagation()}
                    >
                        <S.EdgeActionGroup>
                            <S.EdgeActionButton
                                type="button"
                                title="Insert node here"
                                onClick={event => {
                                    event.stopPropagation();
                                    onInsertNode({
                                        edgeId: edge.id,
                                        sourceNodeId: edge.sourceNodeId,
                                        targetNodeId: edge.targetNodeId,
                                        sourcePort: edge.sourcePort ?? DEFAULT_OUTPUT_PORT,
                                        targetPort: edge.targetPort ?? DEFAULT_INPUT_PORT,
                                        x: midpoint.x,
                                        y: midpoint.y,
                                    });
                                }}
                            >
                                <Icon icon="lucide:plus" width={12} height={12} />
                            </S.EdgeActionButton>
                            <S.EdgeActionButton
                                type="button"
                                $danger
                                title="Remove connection"
                                onClick={event => {
                                    event.stopPropagation();
                                    onRemoveEdge(edge.id);
                                }}
                            >
                                <Icon icon="lucide:trash-2" width={12} height={12} />
                            </S.EdgeActionButton>
                        </S.EdgeActionGroup>
                    </S.EdgeActionZone>
                );
            })}
        </>
    );
}
