import type React from 'react';
import { useMemo, useRef } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import CanvasNodeCard from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/CanvasNode/CanvasNodeCard/CanvasNodeCard';
import StickyNoteCard from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/CanvasNode/StickyNoteCard/StickyNoteCard';
import { getMarqueeSelectedNodeIds } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/selection';
import { EMPTY_OUTPUT_PORT_SET, getConnectedOutputPortsByNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/node';
import { collectDeclaredNamedTabsFromGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import { CODE_NODE_NAME, CODE_NODE_VALUE_KEY } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import type {
    CanvasEdge,
    CanvasNode,
    NodalGraph,
    NodePortKind,
    NodePortSide,
    SelectionBox,
    StickyNoteData,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import * as S from './CanvasNodeLayer.styled';

type StickyNoteUpdate = Partial<StickyNoteData> & { x?: number; y?: number };

interface CanvasNodeLayerProps {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    graph: NodalGraph;
    selectedNodeIds: Set<string>;
    openNodeMenuId: string | null;
    editingStickyNoteId: string | null;
    viewportZoom: number;
    readOnly?: boolean;
    runProgress?: {
        activeNodeId: string | null;
        passedNodeIds: Set<string>;
        nodePassCounts: Map<string, number>;
        errorNodeId?: string | null;
    } | null;
    selectionBox: SelectionBox | null;
    onNodePointerDown: (event: React.PointerEvent<HTMLDivElement>, node: CanvasNode) => void;
    onNodeDoubleClick: (node: CanvasNode) => void;
    onEditStickyNote: (node: CanvasNode) => void;
    onStopEditingStickyNote: () => void;
    onPortPointerDown: (event: React.PointerEvent<HTMLDivElement>, node: CanvasNode, port: NodePortKind, side: NodePortSide) => void;
    onDuplicateNode: (node: CanvasNode) => void;
    onToggleNodeDeactivation: (nodeIds: Iterable<string>) => void;
    onDeleteNodes: (nodeIds: Iterable<string>) => void;
    onToggleNodeMenu: (nodeId: string) => void;
    onUpdateStickyNote: (nodeId: string, changes: StickyNoteUpdate) => void;
    onRun?: () => void;
}

export default function CanvasNodeLayer({
    nodes,
    edges,
    graph,
    selectedNodeIds,
    openNodeMenuId,
    editingStickyNoteId,
    viewportZoom,
    readOnly,
    runProgress,
    selectionBox,
    onNodePointerDown,
    onNodeDoubleClick,
    onEditStickyNote,
    onStopEditingStickyNote,
    onPortPointerDown,
    onDuplicateNode,
    onToggleNodeDeactivation,
    onDeleteNodes,
    onToggleNodeMenu,
    onUpdateStickyNote,
    onRun,
}: CanvasNodeLayerProps) {
    const selectionPreviewNodeIds = useMemo(() => {
        if (!selectionBox) return new Set<string>();

        return getMarqueeSelectedNodeIds(nodes, selectionBox);
    }, [nodes, selectionBox]);
    const connectedOutputPortsByNode = useMemo(() => getConnectedOutputPortsByNode(edges), [edges]);
    const tabDeclarationSignature = JSON.stringify(graph.nodes.flatMap(node => {
        if (node.deactivated || node.system) return [];
        if (node.name === '$gotoUrl') return [[node.id, node.name, node.values?.tabName]];
        if (node.name === CODE_NODE_NAME) return [[node.id, node.name, node.values?.[CODE_NODE_VALUE_KEY]]];
        return [];
    }));
    const tabDeclarationsRef = useRef<{ signature: string; names: string[] } | null>(null);
    if (tabDeclarationsRef.current?.signature !== tabDeclarationSignature) {
        tabDeclarationsRef.current = {
            signature: tabDeclarationSignature,
            names: collectDeclaredNamedTabsFromGraph(graph),
        };
    }
    const availableTabNames = tabDeclarationsRef.current.names;

    return (
        <>
            {nodes.length === 0 ? (
                <S.EmptyNode>
                    <S.EmptyIcon>
                        <Icon icon="lucide:workflow" width={22} height={22} />
                    </S.EmptyIcon>
                    <S.EmptyTitle>Visual Builder</S.EmptyTitle>
                    <S.EmptyText>
                        Drag the canvas to pan, use the mouse wheel to zoom, then add your first node.
                    </S.EmptyText>
                </S.EmptyNode>
            ) : nodes.map(node => node.kind === 'stickyNote' ? (
                <StickyNoteCard
                    key={node.id}
                    node={node}
                    selected={selectedNodeIds.has(node.id)}
                    selectionPreview={selectionPreviewNodeIds.has(node.id)}
                    readOnly={readOnly}
                    openMenu={openNodeMenuId === node.id}
                    editing={editingStickyNoteId === node.id}
                    viewportZoom={viewportZoom}
                    onPointerDown={onNodePointerDown}
                    onUpdate={onUpdateStickyNote}
                    onEdit={onEditStickyNote}
                    onStopEditing={onStopEditingStickyNote}
                    onDuplicate={onDuplicateNode}
                    onDelete={onDeleteNodes}
                    onToggleMenu={onToggleNodeMenu}
                />
            ) : (
                <CanvasNodeCard
                    key={node.id}
                    node={node}
                    availableTabNames={availableTabNames}
                    connectedOutputPorts={connectedOutputPortsByNode.get(node.id) ?? EMPTY_OUTPUT_PORT_SET}
                    selected={selectedNodeIds.has(node.id)}
                    selectionPreview={selectionPreviewNodeIds.has(node.id)}
                    runActive={runProgress?.activeNodeId === node.id}
                    runPassed={runProgress?.passedNodeIds.has(node.id) ?? false}
                    runError={runProgress?.errorNodeId === node.id}
                    readOnly={readOnly}
                    openMenu={openNodeMenuId === node.id}
                    onPointerDown={onNodePointerDown}
                    onDoubleClick={onNodeDoubleClick}
                    onPortPointerDown={onPortPointerDown}
                    onDuplicate={onDuplicateNode}
                    onToggleDeactivation={node => onToggleNodeDeactivation([node.id])}
                    onDelete={onDeleteNodes}
                    onToggleMenu={onToggleNodeMenu}
                    onRun={onRun}
                />
            ))}
            {selectionBox && (
                <S.SelectionBox
                    style={{
                        left: Math.min(selectionBox.startX, selectionBox.currentX),
                        top: Math.min(selectionBox.startY, selectionBox.currentY),
                        width: Math.abs(selectionBox.currentX - selectionBox.startX),
                        height: Math.abs(selectionBox.currentY - selectionBox.startY),
                    }}
                />
            )}
        </>
    );
}
