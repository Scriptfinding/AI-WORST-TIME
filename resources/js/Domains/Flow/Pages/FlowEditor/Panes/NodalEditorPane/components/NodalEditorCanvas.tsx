import type { NodalEditorPaneController } from '../hooks/useNodalEditorPaneController';
import CanvasEdgeActions from './Canvas/CanvasEdgeActions';
import CanvasEdgeLayer from './Canvas/CanvasEdgeLayer';
import CanvasNodeLayer from './Canvas/CanvasNodeLayer';
import * as S from './NodalEditorCanvas.styled';
import NodalEditorOverlays from './NodalEditorOverlays';

interface NodalEditorCanvasProps {
    controller: NodalEditorPaneController;
}

export default function NodalEditorCanvas({ controller }: NodalEditorCanvasProps) {
    const {
        canvasRef,
        canvasViewActions,
        connectionDrag,
        currentGraph,
        deleteNodes,
        duplicateNode,
        edgeDropTarget,
        editingStickyNoteId,
        edges,
        handleAuxClick,
        handleContextMenu,
        handleNodePointerDown,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePortPointerDown,
        handleWheel,
        knifeDrag,
        nodes,
        onRun,
        openNodeMenuId,
        readOnly,
        runProgress,
        selectedNodeIds,
        selectionBox,
        toggleNodeDeactivation,
        updateStickyNote,
        viewport,
    } = controller;

    return (
        <S.Canvas
            ref={canvasRef}
            $knifeActive={Boolean(knifeDrag)}
            $readOnly={readOnly}
            $viewportX={viewport.x}
            $viewportY={viewport.y}
            $zoom={viewport.zoom}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onAuxClick={handleAuxClick}
            onContextMenu={handleContextMenu}
        >
            <S.CanvasViewport $x={viewport.x} $y={viewport.y} $zoom={viewport.zoom}>
                <CanvasEdgeLayer
                    edges={edges}
                    nodes={nodes}
                    connectionDrag={connectionDrag}
                    knifeDrag={knifeDrag}
                    edgeDropTarget={edgeDropTarget}
                    runProgress={runProgress}
                />
                <CanvasEdgeActions
                    edges={edges}
                    nodes={nodes}
                    readOnly={readOnly}
                    onInsertNode={canvasViewActions.insertNodeOnEdge}
                    onRemoveEdge={canvasViewActions.removeEdge}
                />
                <CanvasNodeLayer
                    nodes={nodes}
                    edges={edges}
                    graph={currentGraph}
                    selectedNodeIds={selectedNodeIds}
                    openNodeMenuId={openNodeMenuId}
                    editingStickyNoteId={editingStickyNoteId}
                    viewportZoom={viewport.zoom}
                    readOnly={readOnly}
                    runProgress={runProgress}
                    selectionBox={selectionBox}
                    onNodePointerDown={handleNodePointerDown}
                    onNodeDoubleClick={canvasViewActions.startEditingNode}
                    onEditStickyNote={canvasViewActions.editStickyNote}
                    onStopEditingStickyNote={canvasViewActions.stopEditingStickyNote}
                    onPortPointerDown={handlePortPointerDown}
                    onDuplicateNode={duplicateNode}
                    onToggleNodeDeactivation={toggleNodeDeactivation}
                    onDeleteNodes={deleteNodes}
                    onToggleNodeMenu={canvasViewActions.toggleNodeMenu}
                    onUpdateStickyNote={updateStickyNote}
                    onRun={onRun}
                />
            </S.CanvasViewport>
            <NodalEditorOverlays controller={controller} />
        </S.Canvas>
    );
}
