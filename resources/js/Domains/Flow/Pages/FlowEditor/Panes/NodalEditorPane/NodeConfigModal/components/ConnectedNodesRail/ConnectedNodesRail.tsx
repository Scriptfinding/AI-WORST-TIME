import type { CanvasNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import ConnectedNodeCard from './ConnectedNodeCard/ConnectedNodeCard';
import * as S from './styled';

interface ConnectedNodesRailProps {
    nodes: CanvasNode[];
    side: 'left' | 'right';
    onNavigate?: (node: CanvasNode) => void;
}

export default function ConnectedNodesRail({ nodes, side, onNavigate }: ConnectedNodesRailProps) {
    if (nodes.length === 0) return null;

    return (
        <S.Rail $side={side} onPointerDown={event => event.stopPropagation()}>
            {nodes.map(node => (
                <ConnectedNodeCard
                    key={node.id}
                    node={node}
                    onClick={() => onNavigate?.(node)}
                />
            ))}
        </S.Rail>
    );
}
