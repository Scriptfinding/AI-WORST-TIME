import { useMemo } from 'react';
import NodeConfigModal from '../NodeConfigModal/NodeConfigModal';
import {
    canDeactivateNode,
    EMPTY_OUTPUT_PORT_SET,
    getConnectedOutputPortsByNode,
    shouldDeactivateNodes,
} from '../utils/node';
import CanvasCodePreview from './Canvas/CanvasCodePreview';
import CanvasControls from './Canvas/CanvasControls';
import CanvasMiniMap from './Canvas/CanvasMiniMap';
import ContextMenu from './ContextMenu/ContextMenu';
import NodePicker from './NodePicker/NodePicker';
import type { NodalEditorPaneController } from '../hooks/useNodalEditorPaneController';

interface NodalEditorOverlaysProps {
    controller: NodalEditorPaneController;
}

export default function NodalEditorOverlays({ controller }: NodalEditorOverlaysProps) {
    const {
        activeCategoryKey,
        addNode,
        addStickyNote,
        canvasMode,
        canvasRef,
        canvasViewActions,
        canCopySelection,
        canPasteNodes,
        canSwapSelection,
        contextMenu,
        contextNode,
        copySelectedNodes,
        duplicateNode,
        duplicateSelectedNodes,
        editingAutocompleteContext,
        editingConnectedNodes,
        editingCurrentSiteUrl,
        editingNodeCurrent,
        editingNodeIsFinally,
        edges,
        flow,
        generatedCode,
        latestRun,
        miniMapFading,
        nodes,
        pasteNodesFromClipboard,
        pendingConnectionTarget,
        pendingEdgeInsertion,
        pickerOpen,
        readOnly,
        renameNode,
        resolvedTheme,
        runProgress,
        search,
        selectedEditableNodes,
        selectedNodeIds,
        setEditingNode,
        setSearch,
        setViewport,
        showMiniMap,
        swapSelectedNodes,
        toggleNodeDeactivation,
        toggleNodeOrSelectionDeactivation,
        updateNodeValue,
        viewport,
        visibleEntries,
    } = controller;

    const editingConnectedOutputPorts = useMemo(() => (
        editingNodeCurrent
            ? getConnectedOutputPortsByNode(edges).get(editingNodeCurrent.id) ?? EMPTY_OUTPUT_PORT_SET
            : EMPTY_OUTPUT_PORT_SET
    ), [edges, editingNodeCurrent]);
    const selectedDeactivatableNodes = useMemo(
        () => nodes.filter(node => selectedNodeIds.has(node.id) && canDeactivateNode(node)),
        [nodes, selectedNodeIds],
    );
    const selectionDeactivationAction = selectedDeactivatableNodes.length === 0
        ? null
        : shouldDeactivateNodes(selectedDeactivatableNodes) ? 'deactivate' as const : 'activate' as const;

    return (
        <>
            {contextMenu && (
                <ContextMenu
                    menu={contextMenu}
                    contextNode={contextNode}
                    canSelectAll={nodes.length > 0}
                    canCopySelection={canCopySelection}
                    canDuplicateSelection={canCopySelection}
                    canDeleteSelection={canCopySelection}
                    canPasteHere={canPasteNodes}
                    selectionDeactivationAction={selectionDeactivationAction}
                    readOnly={readOnly}
                    onEditNode={canvasViewActions.editNode}
                    onEditStickyNote={canvasViewActions.editStickyNote}
                    onDuplicateNode={duplicateNode}
                    onDuplicateSelection={duplicateSelectedNodes}
                    onSelectAll={canvasViewActions.selectAllNodes}
                    onCopySelection={copySelectedNodes}
                    onToggleNodeDeactivation={toggleNodeOrSelectionDeactivation}
                    onToggleSelectionDeactivation={() => toggleNodeDeactivation(selectedNodeIds)}
                    onAddNode={() => canvasViewActions.openNodePicker({
                        x: contextMenu.worldX,
                        y: contextMenu.worldY,
                    })}
                    onAddStickyNote={addStickyNote}
                    onTidyWorkflow={canvasViewActions.reorderGraph}
                    onPasteHere={pasteNodesFromClipboard}
                    onDeleteNode={canvasViewActions.deleteNode}
                    onDeleteSelection={canvasViewActions.deleteSelection}
                    onClose={canvasViewActions.closeContextMenu}
                />
            )}
            {canvasMode === 'code' && (
                <CanvasCodePreview
                    generatedCode={generatedCode}
                    resolvedTheme={resolvedTheme}
                    codeSnapshot={runProgress?.codeSnapshot}
                    activeLine={runProgress?.activeLine}
                    passedLines={runProgress?.passedLines}
                    errorLine={runProgress?.errorLine}
                />
            )}
            {canvasMode === 'canvas' && showMiniMap && (
                <CanvasMiniMap
                    nodes={nodes}
                    edges={edges}
                    canvasRef={canvasRef}
                    viewport={viewport}
                    setViewport={setViewport}
                    fading={miniMapFading}
                />
            )}
            <CanvasControls
                zoom={viewport.zoom}
                canvasMode={canvasMode}
                pickerOpen={pickerOpen}
                selectedCount={selectedNodeIds.size}
                canDeleteSelection={selectedEditableNodes.length > 0}
                canSwapSelection={canSwapSelection}
                readOnly={readOnly}
                onCenter={canvasViewActions.viewportCenter}
                onZoomOut={canvasViewActions.zoomOut}
                onZoomIn={canvasViewActions.zoomIn}
                onReorder={canvasViewActions.reorderGraph}
                onDeleteSelection={canvasViewActions.deleteSelection}
                onSwapSelection={swapSelectedNodes}
                onAddStickyNote={canvasViewActions.handleAddStickyNote}
                onToggleMode={canvasViewActions.toggleCanvasMode}
                onTogglePicker={canvasViewActions.toggleNodePicker}
            />
            {canvasMode === 'canvas' && pickerOpen && (
                <NodePicker
                    search={search}
                    activeCategoryKey={activeCategoryKey}
                    visibleEntries={visibleEntries}
                    pendingConnectionTarget={pendingConnectionTarget}
                    pendingEdgeInsertion={pendingEdgeInsertion}
                    onSearchChange={setSearch}
                    onSelectCategory={canvasViewActions.selectNodeCategory}
                    onClose={canvasViewActions.closeNodePicker}
                    onAddNode={addNode}
                />
            )}
            {editingNodeCurrent && editingAutocompleteContext && (
                <NodeConfigModal
                    node={editingNodeCurrent}
                    inputNodes={editingConnectedNodes.inputs}
                    outputNodes={editingConnectedNodes.outputs}
                    connectedOutputPorts={editingConnectedOutputPorts}
                    currentSiteUrl={editingCurrentSiteUrl}
                    flowId={flow.id}
                    latestRun={latestRun}
                    autocompleteContext={editingAutocompleteContext}
                    isFinallyNode={editingNodeIsFinally}
                    readOnly={readOnly}
                    onClose={canvasViewActions.closeNodeConfig}
                    onUpdateValue={updateNodeValue}
                    onRenameNode={renameNode}
                    onNavigateNode={setEditingNode}
                />
            )}
        </>
    );
}
