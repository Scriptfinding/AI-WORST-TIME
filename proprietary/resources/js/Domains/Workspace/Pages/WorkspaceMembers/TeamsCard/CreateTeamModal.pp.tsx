import React from 'react';
import { useForm } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateTeamModal({ isOpen, onClose }: Props) {
    const form = useForm({ name: '' });

    const close = () => {
        if (form.processing) return;
        form.reset();
        form.clearErrors();
        onClose();
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.data.name.trim()) return;
        form.post('/workspace/teams', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={close}
            title="Create a Team"
            caption="Group members by team to manage shared access and organize workspace collaboration."
            footer={
                <>
                    <Button variant="secondary" size="sm" onClick={close}>Cancel</Button>
                    <Button
                        size="sm"
                        onClick={submit}
                        loading={form.processing}
                        disabled={!form.data.name.trim()}
                    >
                        <Icon icon="lucide:plus" width={13} height={13} />
                        Create
                    </Button>
                </>
            }
        >
            <form onSubmit={submit}>
                <Input
                    label="Team name"
                    value={form.data.name}
                    onChange={event => form.setData('name', event.target.value)}
                    error={form.errors.name}
                    placeholder="Engineering, Design, Marketing..."
                    maxLength={50}
                    autoFocus
                />
            </form>
        </Modal>
    );
}
