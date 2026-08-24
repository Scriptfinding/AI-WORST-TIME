import { useEffect, useRef } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { FolderScope } from '@/Domains/Folder/Components/WorkspaceFolderPicker/types';
import * as S from './styled';

interface Props {
    depth: number;
    name: string;
    onNameChange: (name: string) => void;
    onCreate: () => void;
    onCancel: () => void;
    saving: boolean;
    scope?: FolderScope;
}

export default function InlineFolderCreation({
    depth,
    name,
    onNameChange,
    onCreate,
    onCancel,
    saving,
    scope,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <S.Row $depth={depth}>
            <S.FolderIcon $scope={scope}>
                <Icon icon="lucide:folder" />
            </S.FolderIcon>
            <S.Input
                ref={inputRef}
                value={name}
                onChange={event => onNameChange(event.target.value)}
                onKeyDown={event => {
                    if (event.key === 'Enter' && name.trim()) onCreate();
                    if (event.key === 'Escape') onCancel();
                }}
                placeholder="Folder name"
                disabled={saving}
            />
            <S.Actions>
                <S.IconButton
                    $variant="success"
                    onClick={onCreate}
                    title="Create"
                >
                    <Icon icon="lucide:check" width={14} />
                </S.IconButton>
                <S.IconButton
                    $variant="danger"
                    onClick={onCancel}
                    title="Cancel"
                >
                    <Icon icon="lucide:x" width={14} />
                </S.IconButton>
            </S.Actions>
        </S.Row>
    );
}
