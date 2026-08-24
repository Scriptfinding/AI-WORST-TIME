import MenuItem from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/components/MenuItem/MenuItem';
import {
    CopyShortcut,
    DeactivateShortcut,
    DuplicateShortcut,
    SelectAllShortcut,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/components/MenuShortcuts/MenuShortcuts';

interface SelectionActionsSectionProps {
    canSelectAll: boolean;
    canCopySelection: boolean;
    canDuplicateSelection: boolean;
    deactivationAction: 'activate' | 'deactivate' | null;
    hasObjectActions: boolean;
    readOnly?: boolean;
    onSelectAll: () => void;
    onCopySelection: () => void;
    onDuplicateSelection: () => void;
    onToggleDeactivation: () => void;
    onClose: () => void;
}

export default function SelectionActionsSection({
    canSelectAll,
    canCopySelection,
    canDuplicateSelection,
    deactivationAction,
    hasObjectActions,
    readOnly,
    onSelectAll,
    onCopySelection,
    onDuplicateSelection,
    onToggleDeactivation,
    onClose,
}: SelectionActionsSectionProps) {
    const run = (action: () => void) => {
        action();
        onClose();
    };

    return (
        <>
            {canSelectAll && (
                <MenuItem
                    icon="lucide:check-square"
                    label="Select all"
                    shortcut={<SelectAllShortcut />}
                    onSelect={() => run(onSelectAll)}
                />
            )}
            {!hasObjectActions && !readOnly && canDuplicateSelection && (
                <MenuItem
                    icon="lucide:copy"
                    label="Duplicate"
                    shortcut={<DuplicateShortcut />}
                    onSelect={() => run(onDuplicateSelection)}
                />
            )}
            {!hasObjectActions && canCopySelection && (
                <MenuItem
                    icon="lucide:copy"
                    label="Copy selection"
                    shortcut={<CopyShortcut />}
                    onSelect={() => run(onCopySelection)}
                />
            )}
            {!hasObjectActions && !readOnly && deactivationAction && (
                <MenuItem
                    icon={deactivationAction === 'activate' ? 'lucide:power' : 'lucide:power-off'}
                    label={deactivationAction === 'activate' ? 'Activate selection' : 'Deactivate selection'}
                    shortcut={<DeactivateShortcut />}
                    onSelect={() => run(onToggleDeactivation)}
                />
            )}
        </>
    );
}
