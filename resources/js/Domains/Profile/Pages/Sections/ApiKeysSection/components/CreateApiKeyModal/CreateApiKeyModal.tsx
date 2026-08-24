import type { SyntheticEvent } from 'react';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import Modal from '@/Shared/UI/Modal/Modal';
import * as S from './styled';

interface CreateApiKeyModalProps {
    error?: string;
    isOpen: boolean;
    name: string;
    processing: boolean;
    onClose: () => void;
    onNameChange: (name: string) => void;
    onSubmit: (event: SyntheticEvent) => void;
}

export default function CreateApiKeyModal({
    error,
    isOpen,
    name,
    processing,
    onClose,
    onNameChange,
    onSubmit,
}: CreateApiKeyModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Generate API Key"
            width="420px"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={onSubmit} disabled={processing || !name.trim()}>
                        Generate
                    </Button>
                </>
            }
        >
            <S.Form onSubmit={onSubmit}>
                <Input
                    label="Key Name"
                    placeholder="e.g. CI/CD Pipeline, Monitoring..."
                    value={name}
                    onChange={event => onNameChange(event.target.value)}
                    error={error}
                    autoFocus
                />
                <S.Hint>
                    Give a descriptive name so you can identify this key later.
                </S.Hint>
            </S.Form>
        </Modal>
    );
}
