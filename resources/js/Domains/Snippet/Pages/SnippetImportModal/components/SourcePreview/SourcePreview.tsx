import React from 'react';
import type { SnippetType } from '@/Domains/Snippet/types';
import * as S from './styled';

interface Props {
    code: string;
    snippetType: SnippetType;
}

export default function SourcePreview({ code, snippetType }: Props) {
    return (
        <div>
            <S.PreviewLabel>{snippetType === 'nodal' ? 'Nodal snippet JSON' : 'JavaScript snippet'}</S.PreviewLabel>
            <S.CodePreview>{code}</S.CodePreview>
        </div>
    );
}
