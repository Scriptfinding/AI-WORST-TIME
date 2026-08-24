import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { TabBar, TabBtn, Grid, GridItem, UploadArea, UploadHint } from './IconSourceTabs.styled';
import Button from '@/Shared/UI/Button/Button';
import { PRESET_EMOJIS } from './presets';
import type { IconData, IconPickerTab } from './types';

interface IconSourceTabsProps {
    tab: IconPickerTab;
    data: IconData;
    uploading: boolean;
    disabled: boolean;
    responsiveEmojiGrid: boolean;
    uploadHint: string;
    onTabChange: (tab: IconPickerTab) => void;
    onEmojiPick: (emoji: string) => void;
    onUpload: (file: File) => void;
}

export default function IconSourceTabs({
    tab,
    data,
    uploading,
    disabled,
    responsiveEmojiGrid,
    uploadHint,
    onTabChange,
    onEmojiPick,
    onUpload,
}: IconSourceTabsProps) {
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) onUpload(file);
    };

    return (
        <>
            <TabBar>
                <TabBtn type="button" $active={tab === 'emoji'} onClick={() => onTabChange('emoji')}>
                    Emoji
                </TabBtn>
                <TabBtn type="button" $active={tab === 'upload'} onClick={() => onTabChange('upload')}>
                    Upload
                </TabBtn>
            </TabBar>

            {tab === 'emoji' && (
                <Grid $responsive={responsiveEmojiGrid}>
                    {PRESET_EMOJIS.map(emoji => (
                        <GridItem
                            key={emoji}
                            type="button"
                            $active={data.icon_type === 'emoji' && data.icon_value === emoji}
                            $responsive={responsiveEmojiGrid}
                            onClick={() => onEmojiPick(emoji)}
                            disabled={disabled}
                        >
                            {emoji}
                        </GridItem>
                    ))}
                </Grid>
            )}

            {tab === 'upload' && (
                <UploadArea>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        hidden
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        loading={uploading}
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={disabled}
                    >
                        Choose image
                    </Button>
                    <UploadHint>{uploadHint}</UploadHint>
                </UploadArea>
            )}
        </>
    );
}
