import React from 'react';
import { useForm } from '@inertiajs/react';
import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import IconPicker from '@/Domains/Workspace/Components/WorkspaceIcon/IconPicker';
import type { Workspace } from '@/Domains/Workspace/types';
import * as S from './GeneralSection.styled';

interface Props {
    workspace: Workspace;
    readOnly?: boolean;
}

export default function GeneralSection({ workspace, readOnly }: Props) {
    const nameForm = useForm({ name: workspace.name });

    const handleUpdateName = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        nameForm.put('/workspace');
    };

    return (
        <S.CardRow>
            <S.Column>
                <S.Form onSubmit={handleUpdateName}>
                    <Input
                        label="Workspace name"
                        value={nameForm.data.name}
                        onChange={e => nameForm.setData('name', e.target.value)}
                        error={nameForm.errors.name}
                        disabled={readOnly}
                    />
                    {!readOnly && (
                        <S.FormActions>
                            <Button type="submit" size="sm" disabled={nameForm.processing}>
                                Save
                            </Button>
                        </S.FormActions>
                    )}
                </S.Form>
                {!readOnly && (<>
                    <S.Separator />
                    <IconPicker workspace={workspace} />
                </>)}
            </S.Column>
        </S.CardRow>
    );
}
