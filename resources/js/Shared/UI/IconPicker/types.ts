import type { ReactNode } from 'react';

export interface IconData {
    icon_type: 'emoji' | 'color' | 'upload';
    icon_value: string | null;
    icon_color: string | null;
    icon_url: string | null;
    name?: string;
}

export type IconRadius = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type IconPickerTab = 'emoji' | 'upload';

export interface IconPickerProps {
    data: IconData;
    label: string;
    hint: string;
    iconSize?: number;
    iconRadius?: IconRadius;
    onUpdate: (fields: Record<string, string | null>, onDone?: () => void) => void;
    onUpload: (file: File, onDone: () => void) => void;
    onRemove: () => void;
    renderPreview?: (data: IconData, size: number, radius: IconRadius) => ReactNode;
    showRemove?: boolean;
    responsiveEmojiGrid?: boolean;
    uploadHint?: string;
    lockWhileBusy?: boolean;
    trackSaving?: boolean;
}
