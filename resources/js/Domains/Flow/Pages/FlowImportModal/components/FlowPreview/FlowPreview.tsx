import type { ParsedFlowFile } from '@/Domains/Flow/Pages/FlowImportModal/utils';
import * as S from './styled';

interface Props {
    parsedFile: ParsedFlowFile;
}

export default function FlowPreview({ parsedFile }: Props) {
    return (
        <S.CodePreview>
            {parsedFile.flowType === 'nodal'
                ? JSON.stringify(parsedFile.nodalGraph, null, 2)
                : parsedFile.code}
        </S.CodePreview>
    );
}
