import React from 'react';
import { useForm } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import * as S from './styled';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateWorkspaceModal({ isOpen, onClose }: Props) {
    const form = useForm({ name: '', expires_at: '' });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        form.transform(data => ({
            ...data,
            expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
        }));
        form.post('/admin/workspaces', {
            onSuccess: () => {
                onClose();
                form.reset();
            },
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Workspace"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={form.processing}>Create</Button>
                </>
            }
        >
            <S.Form onSubmit={handleSubmit}>
                <Input
                    label="Name"
                    value={form.data.name}
                    onChange={event => form.setData('name', event.target.value)}
                    error={form.errors.name}
                    placeholder="My workspace"
                    autoFocus
                />
                <Input
                    type="datetime-local"
                    label="Expiration date"
                    value={form.data.expires_at}
                    onChange={event => form.setData('expires_at', event.target.value)}
                    error={form.errors.expires_at}
                    hint="Optional. Members will be warned during the final 30 days."
                />
            </S.Form>
        </Modal>
    );
}
