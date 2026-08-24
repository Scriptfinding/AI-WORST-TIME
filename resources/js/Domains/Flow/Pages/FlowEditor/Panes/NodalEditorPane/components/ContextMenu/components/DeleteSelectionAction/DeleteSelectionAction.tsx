import MenuItem from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/components/MenuItem/MenuItem';
import { DeleteShortcut } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/components/MenuShortcuts/MenuShortcuts';

interface DeleteSelectionActionProps {
    onDeleteSelection: () => void;
    onClose: () => void;
}

export default function DeleteSelectionAction({
    onDeleteSelection,
    onClose,
}: DeleteSelectionActionProps) {
    return (
        <MenuItem
            icon="lucide:trash-2"
            label="Delete selection"
            shortcut={<DeleteShortcut />}
            danger
            onSelect={() => {
                onDeleteSelection();
                onClose();
            }}
        />
    );
}
