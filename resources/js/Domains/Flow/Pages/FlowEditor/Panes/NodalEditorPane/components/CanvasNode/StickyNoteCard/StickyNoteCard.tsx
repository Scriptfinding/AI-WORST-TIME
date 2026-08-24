import type React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { CanvasNode, StickyNoteData } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import StickyNoteColorPicker from './ColorPicker/StickyNoteColorPicker';
import StickyNoteContent from './Content/StickyNoteContent';
import StickyNoteResizeHandles from './ResizeHandles/StickyNoteResizeHandles';
import * as S from './styled';
import * as SharedS from '../shared.styled';

const DEFAULT_CUSTOM_COLOR = '#ffffff';
type StickyNoteUpdate = Partial<StickyNoteData> & { x?: number; y?: number };

interface StickyNoteCardProps {
    node: CanvasNode;
    selected: boolean;
    selectionPreview?: boolean;
    readOnly?: boolean;
    openMenu: boolean;
    editing: boolean;
    viewportZoom: number;
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>, node: CanvasNode) => void;
    onUpdate: (nodeId: string, changes: StickyNoteUpdate) => void;
    onEdit: (node: CanvasNode) => void;
    onStopEditing: () => void;
    onDuplicate: (node: CanvasNode) => void;
    onDelete: (nodeIds: Iterable<string>) => void;
    onToggleMenu: (nodeId: string) => void;
}

export default function StickyNoteCard({
    node,
    selected,
    selectionPreview,
    readOnly,
    openMenu,
    editing,
    viewportZoom,
    onPointerDown,
    onUpdate,
    onEdit,
    onStopEditing,
    onDuplicate,
    onDelete,
    onToggleMenu,
}: StickyNoteCardProps) {
    const note = node.stickyNote ?? { content: '', color: 'yellow' as const, width: 260, height: 180 };
    const customColor = note.customColor || DEFAULT_CUSTOM_COLOR;

    const startEditing = () => {
        if (!readOnly) onEdit(node);
    };

    return (
        <S.StickyNote
            data-node-card
            data-sticky-note-card
            data-node-id={node.id}
            data-selected={selected}
            data-selection-preview={selectionPreview}
            $selected={selected}
            $selectionPreview={selectionPreview}
            $color={note.color}
            $customColor={customColor}
            $width={note.width}
            $height={note.height}
            onPointerDown={event => onPointerDown(event, node)}
            onDoubleClick={startEditing}
            style={{ left: node.x, top: node.y }}
        >
            {!readOnly && (
                <S.StickyNoteHoverActions onPointerDown={event => event.stopPropagation()}>
                    <StickyNoteColorPicker
                        color={note.color}
                        customColor={customColor}
                        onChange={changes => onUpdate(node.id, changes)}
                    />
                    <SharedS.NodeHoverMenuWrap data-node-hover-menu>
                        <SharedS.NodeHoverButton
                            type="button"
                            title="More actions"
                            onClick={event => {
                                event.stopPropagation();
                                onToggleMenu(node.id);
                            }}
                        >
                            <Icon icon="lucide:ellipsis" width={13} height={13} />
                        </SharedS.NodeHoverButton>
                        {openMenu && (
                            <SharedS.NodeHoverDropdown onClick={event => event.stopPropagation()}>
                                <SharedS.NodeHoverDropdownItem
                                    type="button"
                                    onClick={() => onDuplicate(node)}
                                >
                                    <span>
                                        <Icon icon="lucide:copy" width={12} height={12} />
                                        Duplicate
                                    </span>
                                    <kbd><b>D</b></kbd>
                                </SharedS.NodeHoverDropdownItem>
                                <SharedS.NodeHoverDropdownItem
                                    type="button"
                                    $danger
                                    onClick={() => onDelete([node.id])}
                                >
                                    <span>
                                        <Icon icon="lucide:trash-2" width={12} height={12} />
                                        Delete
                                    </span>
                                    <kbd>Del / <b>X</b></kbd>
                                </SharedS.NodeHoverDropdownItem>
                            </SharedS.NodeHoverDropdown>
                        )}
                    </SharedS.NodeHoverMenuWrap>
                </S.StickyNoteHoverActions>
            )}

            <StickyNoteContent
                color={note.color}
                content={note.content}
                customColor={customColor}
                editing={editing}
                readOnly={readOnly}
                onChange={content => onUpdate(node.id, { content })}
                onStartEditing={startEditing}
                onStopEditing={onStopEditing}
            />

            {!readOnly && (
                <StickyNoteResizeHandles
                    color={note.color}
                    height={note.height}
                    nodeX={node.x}
                    nodeY={node.y}
                    viewportZoom={viewportZoom}
                    width={note.width}
                    onResize={changes => onUpdate(node.id, changes)}
                />
            )}
        </S.StickyNote>
    );
}
