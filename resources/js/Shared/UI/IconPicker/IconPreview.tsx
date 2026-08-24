import type { ReactNode } from 'react';
import { PreviewRow, PreviewInfo, PreviewLabel, PreviewHint } from './IconPreview.styled';
import Button from '@/Shared/UI/Button/Button';

interface IconPreviewProps {
    preview: ReactNode;
    label: string;
    hint: string;
    showRemove: boolean;
    disabled: boolean;
    onRemove: () => void;
}

export default function IconPreview({
    preview,
    label,
    hint,
    showRemove,
    disabled,
    onRemove,
}: IconPreviewProps) {
    return (
        <PreviewRow>
            {preview}
            <PreviewInfo>
                <PreviewLabel>{label}</PreviewLabel>
                <PreviewHint>{hint}</PreviewHint>
            </PreviewInfo>
            {showRemove && (
                <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={disabled}>
                    Remove
                </Button>
            )}
        </PreviewRow>
    );
}
