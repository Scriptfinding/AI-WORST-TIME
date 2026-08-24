import { useState, type SyntheticEvent } from 'react';
import { useForm } from '@inertiajs/react';

interface UseCreateApiKeyOptions {
    onCreated: (key: string) => void;
}

// Controls the create-key dialog and exposes the secret returned after creation.
export function useCreateApiKey({ onCreated }: UseCreateApiKeyOptions) {
    const [isOpen, setIsOpen] = useState(false);
    const form = useForm({ name: '' });

    const close = () => setIsOpen(false);

    const submit = (event: SyntheticEvent) => {
        event.preventDefault();
        form.post('/api-keys', {
            onSuccess: (page) => {
                form.reset();
                close();

                const key = (page.props as { newApiKey?: string | null }).newApiKey;
                if (key) {
                    onCreated(key);
                }
            },
        });
    };

    return {
        close,
        form,
        isOpen,
        open: () => setIsOpen(true),
        submit,
    };
}
