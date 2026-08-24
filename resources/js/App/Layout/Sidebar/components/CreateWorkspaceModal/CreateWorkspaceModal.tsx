import { useForm } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import * as S from './styled';

interface CreateWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
    const form = useForm({ name: '' });

    const close = () => {
        onClose();
        form.reset();
    };

    return (
        <Modal isOpen={isOpen} onClose={close} title="New workspace">
            <S.Form
                onSubmit={event => {
                    event.preventDefault();
                    form.post('/workspace', { onSuccess: close });
                }}
            >
                <Input
                    label="Workspace name"
                    value={form.data.name}
                    onChange={event => form.setData('name', event.target.value)}
                    error={form.errors.name}
                    placeholder="My workspace"
                    autoFocus
                />
                <S.Actions>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Creating...' : 'Create Workspace'}
                    </Button>
                </S.Actions>
            </S.Form>
        </Modal>
    );
}
