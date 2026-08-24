import React from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import * as S from './styled';

export default function WorkspaceCreate() {
    const form = useForm({ name: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/workspace');
    };

    return (
        <AppLayout title="Create Workspace">
            <S.Container>
                <S.Form onSubmit={handleSubmit}>
                    <Input
                        label="Workspace name"
                        value={form.data.name}
                        onChange={e => form.setData('name', e.target.value)}
                        error={form.errors.name}
                        placeholder="My workspace"
                        autoFocus
                    />
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Creating...' : 'Create Workspace'}
                    </Button>
                </S.Form>
            </S.Container>
        </AppLayout>
    );
}
