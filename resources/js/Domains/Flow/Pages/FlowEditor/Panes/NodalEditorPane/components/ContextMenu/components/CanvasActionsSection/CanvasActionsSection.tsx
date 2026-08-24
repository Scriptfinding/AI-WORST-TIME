import MenuItem from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/components/MenuItem/MenuItem';
import {
    AddNodeShortcut,
    PasteShortcut,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/components/MenuShortcuts/MenuShortcuts';
import { Divider } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/ContextMenu/components/shared.styled';

interface CanvasActionsSectionProps {
    position: { x: number; y: number };
    canPasteHere: boolean;
    onAddNode: () => void;
    onAddStickyNote: (position: { x: number; y: number }) => void;
    onTidyWorkflow: () => void;
    onPasteHere: (position: { x: number; y: number }) => void;
    onClose: () => void;
}

export default function CanvasActionsSection({
    position,
    canPasteHere,
    onAddNode,
    onAddStickyNote,
    onTidyWorkflow,
    onPasteHere,
    onClose,
}: CanvasActionsSectionProps) {
    const run = (action: () => void) => {
        action();
        onClose();
    };

    return (
        <>
            <MenuItem
                icon="lucide:plus"
                label="Add Node"
                shortcut={<AddNodeShortcut />}
                onSelect={() => run(onAddNode)}
            />
            <MenuItem
                icon="lucide:sticky-note"
                label="Add Sticky Note"
                onSelect={() => run(() => onAddStickyNote(position))}
            />
            <Divider role="separator" />
            {canPasteHere && (
                <MenuItem
                    icon="lucide:wand-sparkles"
                    label="Tidy up workflow"
                    shortcut={<kbd><b>T</b></kbd>}
                    onSelect={() => run(onTidyWorkflow)}
                />
            )}
            <MenuItem
                icon="lucide:clipboard-paste"
                label="Paste here"
                shortcut={<PasteShortcut />}
                onSelect={() => run(() => onPasteHere(position))}
            />
        </>
    );
}
