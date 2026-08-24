import type { CanvasNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import MenuItem from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/components/MenuItem/MenuItem';
import {
    CopyShortcut,
    DeleteShortcut,
    DuplicateShortcut,
    EditNodeShortcut,
    DeactivateShortcut,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/components/MenuShortcuts/MenuShortcuts';
import { canDeactivateNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/node';

interface ObjectActionsSectionProps {
    node: CanvasNode;
    canCopySelection: boolean;
    canDeleteSelection: boolean;
    deactivationAction: 'activate' | 'deactivate';
    readOnly?: boolean;
    onEditNode: (node: CanvasNode) => void;
    onEditStickyNote: (node: CanvasNode) => void;
    onCopySelection: () => void;
    onDuplicateNode: (node: CanvasNode) => void;
    onToggleNodeDeactivation: (node: CanvasNode) => void;
    onDeleteNode: (node: CanvasNode) => void;
    onDeleteSelection: () => void;
    onClose: () => void;
}

export default function ObjectActionsSection({
    node,
    canCopySelection,
    canDeleteSelection,
    deactivationAction,
    readOnly,
    onEditNode,
    onEditStickyNote,
    onCopySelection,
    onDuplicateNode,
    onToggleNodeDeactivation,
    onDeleteNode,
    onDeleteSelection,
    onClose,
}: ObjectActionsSectionProps) {
    const run = (action: () => void) => {
        action();
        onClose();
    };

    return (
        <>
            <MenuItem
                icon={node.kind === 'stickyNote' ? 'lucide:pencil' : 'lucide:settings-2'}
                label={node.kind === 'stickyNote' ? 'Edit sticky note' : 'Edit node'}
                shortcut={node.kind === 'stickyNote' ? undefined : <EditNodeShortcut />}
                onSelect={() => run(() => node.kind === 'stickyNote' ? onEditStickyNote(node) : onEditNode(node))}
            />
            {canCopySelection && (
                <MenuItem
                    icon="lucide:copy"
                    label="Copy selection"
                    shortcut={<CopyShortcut />}
                    onSelect={() => run(onCopySelection)}
                />
            )}
            {!readOnly && (
                <MenuItem
                    icon="lucide:copy-plus"
                    label="Duplicate"
                    shortcut={<DuplicateShortcut />}
                    onSelect={() => run(() => onDuplicateNode(node))}
                />
            )}
            {!readOnly && canDeactivateNode(node) && (
                <MenuItem
                    icon={deactivationAction === 'activate' ? 'lucide:power' : 'lucide:power-off'}
                    label={deactivationAction === 'activate' ? 'Activate' : 'Deactivate'}
                    shortcut={<DeactivateShortcut />}
                    onSelect={() => run(() => onToggleNodeDeactivation(node))}
                />
            )}
            {!readOnly && (
                <MenuItem
                    icon="lucide:trash-2"
                    label="Delete"
                    shortcut={<DeleteShortcut />}
                    danger
                    onSelect={() => run(canDeleteSelection
                        ? onDeleteSelection
                        : () => onDeleteNode(node))}
                />
            )}
        </>
    );
}
