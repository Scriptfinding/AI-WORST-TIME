import { useState } from 'react';
import { router } from '@inertiajs/react';

// Centralizes license upload, replacement, deletion, and server-check UI state.
export function useLicenseActions() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [replacing, setReplacing] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [pinging, setPinging] = useState(false);

    const upload = (event: React.FormEvent) => {
        event.preventDefault();
        if (!file) return;

        router.post('/admin/server/license', { license_file: file }, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setUploading(true),
            onSuccess: () => setReplacing(false),
            onFinish: () => {
                setUploading(false);
                setFile(null);
            },
        });
    };

    const drop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setDragging(false);
        const droppedFile = event.dataTransfer.files?.[0];
        if (droppedFile) setFile(droppedFile);
    };

    const cancelReplace = () => {
        setReplacing(false);
        setFile(null);
    };

    const ping = () => {
        router.post('/admin/server/license/ping', {}, {
            preserveScroll: true,
            onStart: () => setPinging(true),
            onFinish: () => setPinging(false),
        });
    };

    return {
        file,
        uploading,
        dragging,
        replacing,
        deleteModalOpen,
        pinging,
        setFile,
        setDragging,
        startReplacing: () => setReplacing(true),
        cancelReplace,
        openDeleteModal: () => setDeleteModalOpen(true),
        closeDeleteModal: () => setDeleteModalOpen(false),
        upload,
        drop,
        ping,
    };
}
