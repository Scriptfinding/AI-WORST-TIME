import type {
    CanvasNode,
    PointNodePosition,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { SYSTEM_FUNCTION_NODE_ID } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/functionGraph';

export const getNodeStartPosition = (node: CanvasNode): PointNodePosition => ({
    id: node.id,
    x: node.x,
    y: node.y,
    kind: node.kind,
    movementAxis: node.system === 'run'
        || node.system === 'terminate'
        || node.id === SYSTEM_FUNCTION_NODE_ID
        ? 'vertical'
        : 'free',
});

export const getDirectionalPushNodeIds = (
    allNodePositions: PointNodePosition[],
    movedNodePositions: PointNodePosition[],
    dx: number,
    dy: number,
) => {
    const distance = Math.hypot(dx, dy);
    if (distance === 0 || movedNodePositions.length === 0) return new Set<string>();

    const axisX = dx / distance;
    const axisY = dy / distance;
    const movedNodeIds = new Set(movedNodePositions.map(position => position.id));
    const leadingProjection = Math.max(...movedNodePositions.map(position => (
        position.x * axisX + position.y * axisY
    )));

    return new Set(allNodePositions
        .filter(position => !movedNodeIds.has(position.id)
            && position.kind !== 'stickyNote'
            && position.x * axisX + position.y * axisY > leadingProjection)
        .map(position => position.id));
};
