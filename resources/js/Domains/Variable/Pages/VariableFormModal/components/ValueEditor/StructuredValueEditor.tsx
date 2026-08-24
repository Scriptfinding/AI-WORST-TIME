import StructuredObjectInput from '@/Domains/Flow/Pages/FlowEditor/components/StructuredObjectInput/StructuredObjectInput';
import type { FieldCollectionType } from '@/Domains/Flow/Pages/FlowEditor/components/StructuredObjectInput/utils';
import * as S from './styled';

interface StructuredValueEditorProps {
    type: FieldCollectionType;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export default function StructuredValueEditor({
    type,
    value,
    onChange,
    error,
}: StructuredValueEditorProps) {
    const label = type === 'array' ? 'Array' : 'Object';

    return (
        <S.JsonField>
            <StructuredObjectInput
                value={value || (type === 'array' ? '[]' : '{}')}
                onChange={nextValue => onChange(nextValue || (type === 'array' ? '[]' : '{}'))}
                label="Value"
                hint={`Build the ${label.toLowerCase()} visually or switch to JSON.`}
                jsonHint={<>Type {'${vars.'} to reference another variable (autocompleted).</>}
                expandableTitle={`${label} value`}
                modeStorageKey={`variable-${type}`}
                collectionType={type}
                editorHeight={200}
            />
            {error && <S.Error>{error}</S.Error>}
            <S.Hint>
                Access nested values with <code>{'${vars.<id>.path}'}</code> (use the autocompletion)
            </S.Hint>
        </S.JsonField>
    );
}
