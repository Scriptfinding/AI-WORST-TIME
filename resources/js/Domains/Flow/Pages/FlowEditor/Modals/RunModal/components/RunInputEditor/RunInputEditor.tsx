import Switch from '@/Shared/UI/Switch/Switch';
import StructuredObjectInput from '@/Domains/Flow/Pages/FlowEditor/components/StructuredObjectInput/StructuredObjectInput';
import { RunInputError } from '@/Domains/Flow/Pages/FlowEditor/shared/runStatus.styled';
import * as S from './styled';

interface RunInputEditorProps {
    flowId: Id;
    isNodalFlow: boolean;
    value: string;
    error: string;
    visible: boolean;
    onChange: (value: string | undefined) => void;
    onVisibleChange: (visible: boolean) => void;
}

export default function RunInputEditor({
    flowId,
    isNodalFlow,
    value,
    error,
    visible,
    onChange,
    onVisibleChange,
}: RunInputEditorProps) {
    return (
        <>
            <Switch
                id="run-show-editor"
                checked={visible}
                onChange={onVisibleChange}
                label="Add additional personal test data"
            />

            {visible && (
                <S.EditorSection>
                    <S.InputHint>
                        Personal test data - only visible to you, persisted for this flow.
                        {!isNodalFlow && <> Available as <code>$input</code> in your flow code.</>}
                    </S.InputHint>
                    <StructuredObjectInput
                        value={value}
                        onChange={onChange}
                        label="Personal test data"
                        jsonHint={<>Type {'${vars.'}, {'${channels.'}, {'${mailboxWatchers.'} or {'${aiModels.'} to insert a reference (autocompleted).</>}
                        expandableTitle="Personal Test Data"
                        modeStorageKey="personal-test-data"
                        flowId={flowId}
                        editorHeight={260}
                    />
                    {error && <RunInputError>{error}</RunInputError>}
                </S.EditorSection>
            )}
        </>
    );
}
