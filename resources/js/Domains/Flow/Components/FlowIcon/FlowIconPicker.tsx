import React, { useCallback } from 'react';
import { router } from '@inertiajs/react';
import IconPicker from '@/Shared/UI/IconPicker/IconPicker';
import type { Flow } from '@/Domains/Flow/types';

interface FlowIconPickerProps {
    flow: Flow;
}

export default function FlowIconPicker({ flow }: FlowIconPickerProps) {
    const handleUpdate = useCallback((data: Record<string, string | null>, onDone?: () => void) => {
        router.put(`/flows/${flow.id}`, data, { preserveScroll: true, onFinish: onDone });
    }, [flow.id]);

    const handleUpload = useCallback((file: File, onDone: () => void) => {
        const data: Record<'icon', File> = { icon: file };
        router.post(`/flows/${flow.id}/icon`, data, {
            preserveScroll: true,
            forceFormData: true,
            onFinish: onDone,
        });
    }, [flow.id]);

    const handleRemove = useCallback(() => {
        router.delete(`/flows/${flow.id}/icon`, { preserveScroll: true });
    }, [flow.id]);

    return (
        <IconPicker
            data={flow}
            label="Flow icon"
            hint="Shown in the explorer and editor"
            onUpdate={handleUpdate}
            onUpload={handleUpload}
            onRemove={handleRemove}
            responsiveEmojiGrid
        />
    );
}
