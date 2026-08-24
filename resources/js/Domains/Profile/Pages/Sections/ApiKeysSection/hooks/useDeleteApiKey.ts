import { useState } from 'react';
import { router } from '@inertiajs/react';

// Tracks the API key awaiting confirmation and performs its deletion.
export function useDeleteApiKey() {
    const [keyId, setKeyId] = useState<number | null>(null);

    const close = () => setKeyId(null);

    const confirm = () => {
        if (!keyId) return;

        router.delete(`/api-keys/${keyId}`, {
            onSuccess: () => {
                close();
            },
        });
    };

    return {
        close,
        confirm,
        isOpen: keyId !== null,
        select: setKeyId,
    };
}
