import { Icon } from '@/Shared/UI/Icon/Icon';
import type { StickyNoteColor } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import * as SharedS from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/CanvasNode/shared.styled';
import * as S from './styled';

const NOTE_COLORS: StickyNoteColor[] = ['yellow', 'orange', 'red', 'green', 'teal', 'blue', 'indigo', 'purple', 'pink'];

interface StickyNoteColorPickerProps {
    color: StickyNoteColor;
    customColor: string;
    onChange: (changes: { color: StickyNoteColor; customColor?: string }) => void;
}

export default function StickyNoteColorPicker({
    color,
    customColor,
    onChange,
}: StickyNoteColorPickerProps) {
    return (
        <S.Wrap>
            <SharedS.NodeHoverButton
                type="button"
                title="Change note color"
                aria-label="Change note color"
            >
                <Icon icon="lucide:palette" width={13} height={13} />
            </SharedS.NodeHoverButton>
            <S.Palette>
                {NOTE_COLORS.map(noteColor => (
                    <S.ColorButton
                        key={noteColor}
                        type="button"
                        title={`Use ${noteColor} note color`}
                        aria-label={`Use ${noteColor} note color`}
                        $color={noteColor}
                        $active={color === noteColor}
                        onClick={event => {
                            event.stopPropagation();
                            onChange({ color: noteColor });
                        }}
                    />
                ))}
                <S.CustomColorButton
                    title="Use custom note color"
                    aria-label="Use custom note color"
                    $color={customColor}
                    $active={color === 'custom'}
                    onPointerDown={event => event.stopPropagation()}
                >
                    <input
                        type="color"
                        value={customColor}
                        onChange={event => onChange({ color: 'custom', customColor: event.target.value })}
                    />
                </S.CustomColorButton>
            </S.Palette>
        </S.Wrap>
    );
}
