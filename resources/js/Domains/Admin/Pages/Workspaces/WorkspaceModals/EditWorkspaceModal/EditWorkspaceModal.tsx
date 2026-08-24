import React from 'react';
import { useForm } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import type { WorkspaceWithRelations } from '@/Domains/Admin/Pages/Workspaces/Workspaces';
import * as S from './styled';

interface Props {
    workspace: WorkspaceWithRelations;
    onClose: () => void;
}

function toLocalDateTimeInput(value: string | null): string {
    if (!value) return '';

    const date = new Date(value);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

    return localDate.toISOString().slice(0, 16);
}

export default function EditWorkspaceModal({ workspace, onClose }: Props) {
    const form = useForm({
        name: workspace.name,
        lookup_key: workspace.lookup_key ?? '',
        expires_at: toLocalDateTimeInput(workspace.expires_at),
    });

    const handleUpdate = () => {
        form.transform(data => ({
            ...data,
            lookup_key: data.lookup_key.trim() || null,
            expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
        }));
        form.put(`/admin/workspaces/${workspace.id}`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        handleUpdate();
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={`Edit Workspace - ${workspace.name}`}
            footer={
                <>
                    <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
                    <Button size="sm" disabled={form.processing} onClick={handleUpdate}>
                        Save changes
                    </Button>
                </>
            }
        >
            <S.Form onSubmit={handleSubmit}>
                <Input
                    label="Name"
                    value={form.data.name}
                    onChange={event => form.setData('name', event.target.value)}
                    error={form.errors.name}
                    autoFocus
                />
                <Input
                    label="Lookup key"
                    value={form.data.lookup_key}
                    onChange={event => form.setData('lookup_key', event.target.value)}
                    error={form.errors.lookup_key}
                    hint="Unique API identifier. Use lowercase letters, numbers, underscores, or hyphens."
                    placeholder="production_eu"
                    maxLength={255}
                />
                <Input
                    type="datetime-local"
                    label="Expiration date"
                    value={form.data.expires_at}
                    onChange={event => form.setData('expires_at', event.target.value)}
                    error={form.errors.expires_at}
                    hint="Optional. Clear this field to remove the expiration."
                />
            </S.Form>
        </Modal>
    );
}
