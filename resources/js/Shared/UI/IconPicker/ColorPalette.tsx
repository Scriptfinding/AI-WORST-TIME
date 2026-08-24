import { Icon } from '@/Shared/UI/Icon/Icon';
import { SectionLabel, ColorRow, SmallColorSwatch, TransparentSwatch, CustomColorLabel } from './ColorPalette.styled';
import { PRESET_COLORS } from './presets';

interface ColorPaletteProps {
    color: string | null;
    customColor: string;
    disabled: boolean;
    onColorPick: (color: string | null) => void;
    onCustomColorPick: (color: string) => void;
}

export default function ColorPalette({
    color,
    customColor,
    disabled,
    onColorPick,
    onCustomColorPick,
}: ColorPaletteProps) {
    return (
        <>
            <SectionLabel>Background color</SectionLabel>
            <ColorRow>
                <TransparentSwatch
                    type="button"
                    $active={!color}
                    onClick={() => onColorPick(null)}
                    disabled={disabled}
                    title="Transparent"
                />
                {PRESET_COLORS.map(presetColor => (
                    <SmallColorSwatch
                        key={presetColor}
                        type="button"
                        $color={presetColor}
                        $active={color === presetColor}
                        onClick={() => onColorPick(presetColor)}
                        disabled={disabled}
                    />
                ))}
                <CustomColorLabel
                    $active={!!color && !PRESET_COLORS.includes(color)}
                    $disabled={disabled}
                    title="Custom color"
                >
                    <Icon icon="lucide:pipette" width={14} />
                    <input
                        type="color"
                        value={customColor}
                        onChange={event => onCustomColorPick(event.target.value)}
                        disabled={disabled}
                    />
                </CustomColorLabel>
            </ColorRow>
        </>
    );
}
