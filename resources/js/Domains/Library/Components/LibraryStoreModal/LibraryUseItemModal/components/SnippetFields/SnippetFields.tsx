import React from 'react';
import Input from '@/Shared/UI/Input/Input';
import type { LibraryUseFormData } from '@/Domains/Library/Components/LibraryStoreModal/types';
import * as S from './styled';

interface Props {
    label: LibraryUseFormData['label'];
    group: LibraryUseFormData['group'];
    onLabelChange: (value: LibraryUseFormData['label']) => void;
    onGroupChange: (value: LibraryUseFormData['group']) => void;
}

export default function SnippetFields({
    label,
    group,
    onLabelChange,
    onGroupChange,
}: Props) {
    return (
        <>
            <S.Fields>
                <Input
                    label="Label"
                    value={label}
                    onChange={event => onLabelChange(event.target.value)}
                    placeholder="My snippet"
                    autoFocus
                />
            </S.Fields>
            <Input
                label="Group (Optional)"
                value={group}
                onChange={event => onGroupChange(event.target.value)}
                placeholder="Group name"
            />
        </>
    );
}
