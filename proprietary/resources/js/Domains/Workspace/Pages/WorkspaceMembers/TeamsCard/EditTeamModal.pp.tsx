import React from 'react';
import { useForm } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import type { Team } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';

interface Props {
    team: Team;
    onClose: () => void;
}

export default function EditTeamModal({ team, onClose }: Props) {
    const form = useForm({ name: team.name });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.data.name.trim()) return;
        form.put(`/workspace/teams/${team.id}`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title="Rename Team"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={submit} loading={form.processing} disabled={!form.data.name.trim()}>
                        Rename
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
                    placeholder="Team name"
                    maxLength={50}
                    autoFocus
                />
            </form>
        </Modal>
    );
}
