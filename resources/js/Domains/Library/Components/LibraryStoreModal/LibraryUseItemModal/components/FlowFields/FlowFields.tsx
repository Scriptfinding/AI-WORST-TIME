import React from 'react';
import Input from '@/Shared/UI/Input/Input';
import type { LibraryUseFormData } from '@/Domains/Library/Components/LibraryStoreModal/types';
import * as S from './styled';

interface Props {
    name: LibraryUseFormData['name'];
    onNameChange: (value: LibraryUseFormData['name']) => void;
}

export default function FlowFields({
    name,
    onNameChange,
}: Props) {
    return (
        <S.Fields>
            <Input
                label="Flow name"
                value={name}
                onChange={event => onNameChange(event.target.value)}
                placeholder="My automation flow"
                maxLength={128}
                showCharCount
                autoFocus
            />
        </S.Fields>
    );
}
