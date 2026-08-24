import { Icon } from '@/Shared/UI/Icon/Icon';
import type { NodalParamDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';
import * as S from './styled';

interface ObjectAddControlsProps {
    availableFieldKeys: string[];
    meta: NodalParamDef;
    allowCustomFields: boolean;
    readOnly?: boolean;
    onAddField: (key: string) => void;
    onAddCustomField: () => void;
}

export default function ObjectAddControls({
    availableFieldKeys,
    meta,
    allowCustomFields,
    readOnly,
    onAddField,
    onAddCustomField,
}: ObjectAddControlsProps) {
    return (
        <>
            {availableFieldKeys.length > 0 && (
                <CustomSelect
                    value=""
                    disabled={readOnly}
                    placeholder="Add option..."
                    showOptionValue={false}
                    options={availableFieldKeys.map(key => ({
                        value: key,
                        label: meta.objectFields?.[key]?.label ?? key,
                    }))}
                    onChange={onAddField}
                />
            )}
            {allowCustomFields && (
                <S.AddRow>
                    <S.AddButton
                        type="button"
                        disabled={readOnly}
                        onClick={onAddCustomField}
                    >
                        <Icon icon="lucide:plus" width={12} height={12} />
                        Add entry
                    </S.AddButton>
                </S.AddRow>
            )}
        </>
    );
}
