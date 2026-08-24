import { useCallback } from 'react';
import { router } from '@inertiajs/react';
import BaseIconPicker from '@/Shared/UI/IconPicker/IconPicker';
import WorkspaceIcon from './WorkspaceIcon';
import type { Workspace } from '@/Domains/Workspace/types';

interface IconPickerProps {
    workspace: Workspace;
}

const UPLOAD_HINT = 'PNG, JPG, SVG or WebP. Max 2MB. Transparent images work with a background color.';

export default function IconPicker({ workspace }: IconPickerProps) {
    const handleUpdate = useCallback((
        data: Record<string, string | null>,
        onDone?: () => void
    ) => {
        router.put('/workspace', data, {
            preserveScroll: true,
            onFinish: onDone,
        });
    }, []);

    const handleUpload = useCallback((file: File, onDone: () => void) => {
        const data: Record<'icon', File> = { icon: file };
        router.post('/workspace/icon', data, {
            preserveScroll: true,
            forceFormData: true,
            onFinish: onDone,
        });
    }, []);

    const handleRemove = useCallback(() => {
        router.delete('/workspace/icon', { preserveScroll: true });
        router.put('/workspace', {
            icon_type: 'emoji',
            icon_value: null,
            icon_color: null,
        }, { preserveScroll: true });
    }, []);

    return (
        <BaseIconPicker
            data={workspace}
            label="Workspace icon"
            hint="Shown in the sidebar and dropdowns"
            onUpdate={handleUpdate}
            onUpload={handleUpload}
            onRemove={handleRemove}
            renderPreview={(data, size) => <WorkspaceIcon workspace={data} size={size} />}
            showRemove={workspace.icon_type !== 'emoji' || !!workspace.icon_value}
            responsiveEmojiGrid
            uploadHint={UPLOAD_HINT}
            lockWhileBusy={false}
            trackSaving={false}
        />
    );
}
