import { RunInputError } from '@/Domains/Flow/Pages/FlowEditor/shared/runStatus.styled';
import StructuredObjectInput from '@/Domains/Flow/Pages/FlowEditor/components/StructuredObjectInput/StructuredObjectInput';
import * as S from './styled';

interface RerunInputEditorProps {
    flowId: Id;
    value: string;
    error: string;
    onChange: (value: string) => void;
}

export default function RerunInputEditor({
    flowId,
    value,
    error,
    onChange,
}: RerunInputEditorProps) {
    return (
        <>
            <S.InputHintRow>
                <S.InputHint>Input data from the previous run. Edit before re-running.</S.InputHint>
            </S.InputHintRow>
            <StructuredObjectInput
                value={value}
                onChange={nextValue => onChange(nextValue || '{}')}
                label="Input data"
                jsonHint={<>Type {'${vars.'}, {'${channels.'}, {'${mailboxWatchers.'} or {'${aiModels.'} to insert a reference (autocompleted).</>}
                expandableTitle="Rerun Input Data"
                modeStorageKey="rerun-input-data"
                flowId={flowId}
                editorHeight={260}
            />
            {error && <RunInputError>{error}</RunInputError>}
        </>
    );
}
