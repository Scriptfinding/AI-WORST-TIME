import { createPortal } from 'react-dom';
import CanvasActionsSection from './components/CanvasActionsSection/CanvasActionsSection';
import DeleteSelectionAction from './components/DeleteSelectionAction/DeleteSelectionAction';
import MenuSection from './components/MenuSection/MenuSection';
import ObjectActionsSection from './components/ObjectActionsSection/ObjectActionsSection';
import SelectionActionsSection from './components/SelectionActionsSection/SelectionActionsSection';
import { useContextMenuInteractions } from './hooks/useContextMenuInteractions';
import * as S from './styled';
import type { ContextMenuProps } from './types';

export type { ContextMenuState } from './types';

export default function ContextMenu({
    menu,
    contextNode,
    canSelectAll,
    canCopySelection,
    canDuplicateSelection,
    canDeleteSelection,
    canPasteHere,
    selectionDeactivationAction,
    readOnly,
    onEditNode,
    onEditStickyNote,
    onDuplicateNode,
    onDuplicateSelection,
    onSelectAll,
    onCopySelection,
    onToggleNodeDeactivation,
    onToggleSelectionDeactivation,
    onAddNode,
    onAddStickyNote,
    onTidyWorkflow,
    onPasteHere,
    onDeleteNode,
    onDeleteSelection,
    onClose,
}: ContextMenuProps) {
    const hasNodeActions = Boolean(contextNode && !contextNode.system && contextNode.kind !== 'stickyNote');
    const hasStickyNoteActions = Boolean(contextNode && !contextNode.system && contextNode.kind === 'stickyNote');
    const hasObjectActions = hasNodeActions || hasStickyNoteActions;
    const hasSelectionActions = canSelectAll || canDuplicateSelection || canCopySelection || Boolean(selectionDeactivationAction);
    const objectDeactivationAction = selectionDeactivationAction
        ?? (contextNode?.deactivated ? 'activate' : 'deactivate');
    const hasCreateActions = !readOnly;
    const { menuRef, position, handleKeyDown } = useContextMenuInteractions({
        anchor: { left: menu.x, top: menu.y },
        onClose,
    });

    return createPortal(
        <S.ContextMenu
            ref={menuRef}
            role="menu"
            aria-label="Canvas actions"
            style={{ left: position.left, top: position.top }}
            onPointerDown={event => event.stopPropagation()}
            onClick={event => event.stopPropagation()}
            onContextMenu={event => event.preventDefault()}
            onKeyDown={handleKeyDown}
        >
            {hasObjectActions && contextNode && (
                <ObjectActionsSection
                    node={contextNode}
                    canCopySelection={canCopySelection}
                    canDeleteSelection={canDeleteSelection}
                    deactivationAction={objectDeactivationAction}
                    readOnly={readOnly}
                    onEditNode={onEditNode}
                    onEditStickyNote={onEditStickyNote}
                    onCopySelection={onCopySelection}
                    onDuplicateNode={onDuplicateNode}
                    onToggleNodeDeactivation={onToggleNodeDeactivation}
                    onDeleteNode={onDeleteNode}
                    onDeleteSelection={onDeleteSelection}
                    onClose={onClose}
                />
            )}
            <MenuSection separated={hasObjectActions}>
                <SelectionActionsSection
                    canSelectAll={canSelectAll}
                    canCopySelection={canCopySelection}
                    canDuplicateSelection={canDuplicateSelection}
                    deactivationAction={selectionDeactivationAction}
                    hasObjectActions={hasObjectActions}
                    readOnly={readOnly}
                    onSelectAll={onSelectAll}
                    onCopySelection={onCopySelection}
                    onDuplicateSelection={onDuplicateSelection}
                    onToggleDeactivation={onToggleSelectionDeactivation}
                    onClose={onClose}
                />
            </MenuSection>
            {hasCreateActions && (
                <MenuSection separated={!hasObjectActions && hasSelectionActions}>
                    <CanvasActionsSection
                        position={{ x: menu.worldX, y: menu.worldY }}
                        canPasteHere={canPasteHere}
                        onAddNode={onAddNode}
                        onAddStickyNote={onAddStickyNote}
                        onTidyWorkflow={onTidyWorkflow}
                        onPasteHere={onPasteHere}
                        onClose={onClose}
                    />
                </MenuSection>
            )}
            {!hasObjectActions && canDeleteSelection && !readOnly && (
                <DeleteSelectionAction
                    onDeleteSelection={onDeleteSelection}
                    onClose={onClose}
                />
            )}
        </S.ContextMenu>,
        document.body,
    );
}
