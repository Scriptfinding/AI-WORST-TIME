import type { NodalParamDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import type {
    IfConditionCategory,
    ObjectNodeParameterField,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { NodeValidationIssue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/validation';
import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';
import {
    IF_CATEGORIES,
    IF_CATEGORY_ICONS,
    IF_CATEGORY_LABELS,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/utils/ifConditions';
import {
    getEffectiveObjectFieldMeta,
    isFunctionMap,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/utils/objectParameters';
import ExpressionInput from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/ExpressionInput/ExpressionInput';
import NestedValueEditor, {
    type RenderNestedObject,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/ObjectParameterInput/NestedValueEditor/NestedValueEditor';
import * as S from './styled';

interface ObjectRowsProps {
    fields: ObjectNodeParameterField[];
    path: string;
    meta: NodalParamDef;
    validationIssues: NodeValidationIssue[];
    allowCustomFields: boolean;
    outputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    currentSiteUrl?: string | null;
    flowId?: Id;
    readOnly?: boolean;
    onUpdateField: (
        fieldId: string,
        patch: Partial<Pick<ObjectNodeParameterField, 'key' | 'keyMode' | 'valueType' | 'value'>>,
    ) => void;
    onRemoveField: (fieldId: string) => void;
    renderNestedObject: RenderNestedObject;
}

export default function ObjectRows({
    fields,
    path,
    meta,
    validationIssues,
    allowCustomFields,
    outputData,
    autocompleteContext,
    currentSiteUrl,
    flowId,
    readOnly,
    onUpdateField,
    onRemoveField,
    renderNestedObject,
}: ObjectRowsProps) {
    return (
        <>
            {fields.map(field => {
                const fieldMeta = meta.objectFields?.[field.key];
                if (fieldMeta?.valueType === 'flow') return null;

                const functionMap = isFunctionMap(meta);
                const customField = allowCustomFields && !fieldMeta;
                const valueType = functionMap ? 'code' : field.valueType ?? 'string';
                const effectiveMeta = functionMap ? {
                    label: 'Function',
                    description: 'JavaScript function available under this key.',
                    input: 'code' as const,
                    valueType: 'function' as const,
                } : getEffectiveObjectFieldMeta(fieldMeta, customField, valueType);
                const oneOfGroup = meta.requiredOneOf?.find(group => group.includes(field.key));
                const hasOneOfAlternative = oneOfGroup?.some(key => (
                    key !== field.key && fields.some(candidate => candidate.key === key)
                ));
                const removable = !fieldMeta?.required && (!oneOfGroup || hasOneOfAlternative);
                const validationIssue = validationIssues.find(issue => issue.path === `${path}.${field.key}`);
                const customKeyInput = customField ? (
                    <S.CustomFieldHeader>
                        {functionMap ? (
                            <S.FieldKeyInput
                                data-object-key-input={field.id}
                                value={field.key}
                                placeholder="Function name"
                                disabled={readOnly}
                                onChange={event => onUpdateField(field.id, { key: event.target.value })}
                            />
                        ) : (
                            <S.KeyExpressionField data-object-key-input={field.id}>
                                <ExpressionInput
                                    label="Name"
                                    hint={null}
                                    inlineLabel
                                    inputType="text"
                                    placeholder="Variable name"
                                    value={{
                                        mode: field.keyMode
                                            ?? (field.key.includes('{{') ? 'expression' : 'fixed'),
                                        value: field.key,
                                    }}
                                    outputData={outputData}
                                    autocompleteContext={autocompleteContext}
                                    flowId={flowId}
                                    readOnly={readOnly}
                                    onChange={next => onUpdateField(field.id, {
                                        key: next.value,
                                        keyMode: next.mode,
                                    })}
                                />
                            </S.KeyExpressionField>
                        )}
                        {!functionMap && (
                            <CustomSelect
                                value={valueType}
                                disabled={readOnly}
                                compact
                                showOptionValue={false}
                                options={IF_CATEGORIES.map(category => ({
                                    value: category,
                                    label: IF_CATEGORY_LABELS[category],
                                    icon: IF_CATEGORY_ICONS[category],
                                }))}
                                onChange={nextValue => onUpdateField(field.id, {
                                    valueType: nextValue as IfConditionCategory,
                                })}
                            />
                        )}
                    </S.CustomFieldHeader>
                ) : null;

                return (
                    <S.FormRow key={field.id}>
                        <S.KeyValueRow>
                            <NestedValueEditor
                                field={field}
                                meta={effectiveMeta}
                                valueType={valueType}
                                labelSlot={customKeyInput}
                                outputData={outputData}
                                autocompleteContext={autocompleteContext}
                                currentSiteUrl={currentSiteUrl}
                                flowId={flowId}
                                readOnly={readOnly}
                                invalid={Boolean(validationIssue)}
                                errorMessage={validationIssue?.message}
                                onRemove={removable ? () => onRemoveField(field.id) : undefined}
                                onChange={value => onUpdateField(field.id, { value })}
                                renderNestedObject={renderNestedObject}
                            />
                        </S.KeyValueRow>
                    </S.FormRow>
                );
            })}
        </>
    );
}
