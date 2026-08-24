import type { CanvasNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';

export interface ContextMenuState {
    x: number;
    y: number;
    worldX: number;
    worldY: number;
    nodeId?: string | null;
}

export interface ContextMenuProps {
    menu: ContextMenuState;
    contextNode: CanvasNode | null;
    canSelectAll: boolean;
    canCopySelection: boolean;
    canDuplicateSelection: boolean;
    canDeleteSelection: boolean;
    canPasteHere: boolean;
    selectionDeactivationAction: 'activate' | 'deactivate' | null;
    readOnly?: boolean;
    onEditNode: (node: CanvasNode) => void;
    onEditStickyNote: (node: CanvasNode) => void;
    onDuplicateNode: (node: CanvasNode) => void;
    onDuplicateSelection: () => void;
    onSelectAll: () => void;
    onCopySelection: () => void;
    onToggleNodeDeactivation: (node: CanvasNode) => void;
    onToggleSelectionDeactivation: () => void;
    onAddNode: () => void;
    onAddStickyNote: (position: { x: number; y: number }) => void;
    onTidyWorkflow: () => void;
    onPasteHere: (position: { x: number; y: number }) => void;
    onDeleteNode: (node: CanvasNode) => void;
    onDeleteSelection: () => void;
    onClose: () => void;
}
