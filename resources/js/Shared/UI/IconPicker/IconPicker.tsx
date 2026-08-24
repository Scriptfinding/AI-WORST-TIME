import { useCallback, useState } from 'react';
import { Wrapper } from './styled';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import { useDebouncedCallback } from '@/Shared/Hooks/useDebouncedCallback';
import ColorPalette from './ColorPalette';
import IconPreview from './IconPreview';
import IconSourceTabs from './IconSourceTabs';
import { PRESET_COLORS, PRESET_EMOJIS } from './presets';
import type { IconPickerProps } from './types';

export { PRESET_COLORS, PRESET_EMOJIS };
export type { IconData, IconPickerProps, IconRadius } from './types';

const DEFAULT_UPLOAD_HINT = 'PNG, JPG, SVG or WebP. Max 2MB.';

export default function IconPicker({
    data,
    label,
    hint,
    iconSize = 40,
    iconRadius = 'sm',
    onUpdate,
    onUpload,
    onRemove,
    renderPreview,
    showRemove,
    responsiveEmojiGrid = false,
    uploadHint = DEFAULT_UPLOAD_HINT,
    lockWhileBusy = true,
    trackSaving = true,
}: IconPickerProps) {
    const [tab, setTab] = useState<'emoji' | 'upload'>(
        data.icon_type === 'upload' ? 'upload' : 'emoji'
    );
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [customColor, setCustomColor] = useState(
        () => data.icon_color && !PRESET_COLORS.includes(data.icon_color)
            ? data.icon_color
            : '#888888'
    );
    const busy = uploading || (trackSaving && saving);
    const disabled = lockWhileBusy && busy;

    const handleColorPick = useCallback((color: string | null) => {
        if (trackSaving) setSaving(true);
        const done = () => setSaving(false);

        if (data.icon_type === 'upload') {
            onUpdate({ icon_color: color }, done);
        } else if (data.icon_type === 'emoji' && data.icon_value) {
            onUpdate({ icon_type: 'emoji', icon_value: data.icon_value, icon_color: color }, done);
        } else {
            onUpdate({ icon_type: 'color', icon_value: null, icon_color: color }, done);
        }
    }, [data.icon_type, data.icon_value, onUpdate, trackSaving]);

    const saveCustomColor = useDebouncedCallback(handleColorPick, 300);

    const handleCustomColorPick = useCallback((color: string) => {
        setCustomColor(color);
        saveCustomColor(color);
    }, [saveCustomColor]);

    const handleEmojiPick = (emoji: string) => {
        if (trackSaving) setSaving(true);
        onUpdate(
            { icon_type: 'emoji', icon_value: emoji, icon_color: data.icon_color },
            () => setSaving(false)
        );
    };

    const handleUpload = (file: File) => {
        setUploading(true);
        onUpload(file, () => setUploading(false));
    };

    const defaultShowRemove = data.icon_type !== 'color' || data.icon_value || data.icon_color;
    const preview = renderPreview
        ? renderPreview(data, iconSize, iconRadius)
        : <FlowIcon flow={data} size={iconSize} radius={iconRadius} />;

    return (
        <Wrapper $busy={lockWhileBusy && busy}>
            <IconPreview
                preview={preview}
                label={label}
                hint={hint}
                showRemove={showRemove ?? !!defaultShowRemove}
                disabled={disabled}
                onRemove={onRemove}
            />

            <ColorPalette
                color={data.icon_color}
                customColor={customColor}
                disabled={disabled}
                onColorPick={handleColorPick}
                onCustomColorPick={handleCustomColorPick}
            />

            <IconSourceTabs
                tab={tab}
                data={data}
                uploading={uploading}
                disabled={disabled}
                responsiveEmojiGrid={responsiveEmojiGrid}
                uploadHint={uploadHint}
                onTabChange={setTab}
                onEmojiPick={handleEmojiPick}
                onUpload={handleUpload}
            />
        </Wrapper>
    );
}
