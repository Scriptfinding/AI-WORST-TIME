import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './CanvasControls.styled';

interface CanvasControlsProps {
    zoom: number;
    canvasMode: 'canvas' | 'code';
    pickerOpen: boolean;
    selectedCount: number;
    canDeleteSelection: boolean;
    canSwapSelection: boolean;
    readOnly?: boolean;
    onCenter: () => void;
    onZoomOut: () => void;
    onZoomIn: () => void;
    onReorder: () => void;
    onDeleteSelection: () => void;
    onSwapSelection: () => void;
    onAddStickyNote: () => void;
    onToggleMode: () => void;
    onTogglePicker: () => void;
}

export default function CanvasControls({
    zoom,
    canvasMode,
    pickerOpen,
    selectedCount,
    canDeleteSelection,
    canSwapSelection,
    readOnly,
    onCenter,
    onZoomOut,
    onZoomIn,
    onReorder,
    onDeleteSelection,
    onSwapSelection,
    onAddStickyNote,
    onToggleMode,
    onTogglePicker,
}: CanvasControlsProps) {
    return (
        <>
            <S.CanvasControls>
                <S.CanvasControlButton type="button" onClick={onCenter} title="Center on graph">
                    <Icon icon="lucide:locate-fixed" width={14} height={14} />
                </S.CanvasControlButton>
                <S.CanvasControlButton type="button" onClick={onZoomOut} title="Zoom out">
                    <Icon icon="lucide:minus" width={14} height={14} />
                </S.CanvasControlButton>
                <S.ZoomValue>{Math.round(zoom * 100)}%</S.ZoomValue>
                <S.CanvasControlButton type="button" onClick={onZoomIn} title="Zoom in">
                    <Icon icon="lucide:plus" width={14} height={14} />
                </S.CanvasControlButton>
                {!readOnly && (
                    <S.CanvasControlButton type="button" onClick={onReorder} title="Broom. Reorder graph">
                        <Icon icon="lucide:wand-sparkles" width={14} height={14} />
                    </S.CanvasControlButton>
                )}
                <S.CanvasControlButton
                    type="button"
                    onClick={onToggleMode}
                    title={canvasMode === 'canvas' ? 'Show generated code' : 'Show visual canvas'}
                >
                    <Icon icon={canvasMode === 'canvas' ? 'lucide:code-2' : 'lucide:workflow'} width={14} height={14} />
                </S.CanvasControlButton>
            </S.CanvasControls>

            {canvasMode === 'canvas' && selectedCount > 0 && (
                <S.SelectionToolbar>
                    <S.SelectionToolbarCount>
                        {selectedCount} selected
                    </S.SelectionToolbarCount>
                    {!readOnly && canSwapSelection && (
                        <S.CanvasControlButton
                            type="button"
                            onClick={onSwapSelection}
                            title="Swap selected nodes"
                        >
                            <Icon icon="lucide:shuffle" width={14} height={14} />
                        </S.CanvasControlButton>
                    )}
                    {!readOnly && canDeleteSelection && (
                        <S.CanvasControlButton
                            type="button"
                            onClick={onDeleteSelection}
                            title="Delete selection"
                        >
                            <Icon icon="lucide:trash-2" width={14} height={14} />
                        </S.CanvasControlButton>
                    )}
                </S.SelectionToolbar>
            )}

            {!readOnly && canvasMode === 'canvas' && (
                <S.AddButtonGroup>
                    <S.AddButton
                        type="button"
                        onClick={onAddStickyNote}
                        title="Add sticky note"
                        $secondary
                    >
                        <Icon icon="lucide:sticky-note" />
                    </S.AddButton>
                    <S.AddButton
                        type="button"
                        data-node-picker-trigger
                        onClick={onTogglePicker}
                        title="Add node"
                    >
                        <Icon icon={pickerOpen ? 'lucide:x' : 'lucide:plus'} />
                    </S.AddButton>
                </S.AddButtonGroup>
            )}
        </>
    );
}
