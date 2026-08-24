import { Icon } from '@/Shared/UI/Icon/Icon';
import type { NodalParamDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import type {
    NodeParameterValue,
    ObjectNodeParameterValue,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import type { NodeValidationIssue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/validation';
import {
    normalizeScalarParameterValue,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/expression';
import {
    getObjectFields,
    normalizeObjectParameterValue,
    OBJECT_INPUT_MODE_OPTIONS,
    prependCustomObjectField,
    removeObjectField,
    switchObjectInputMode,
    updateObjectField,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/utils/objectParameters';
import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';
import ExpressionInput from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/ExpressionInput/ExpressionInput';
import * as Shared from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/shared.styled';
import * as ObjectStyles from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/ObjectParameterInput/styled';
import * as S from './styled';

const GETTER_OPTIONS = [
    { value: 'textContent', label: 'Text content' },
    { value: 'innerText', label: 'Inner text' },
    { value: 'className', label: 'Class name' },
    { value: 'id', label: 'ID' },
    { value: 'tagName', label: 'Tag name' },
    { value: 'value', label: 'Value' },
    { value: 'href', label: 'Link URL' },
    { value: 'src', label: 'Source URL' },
    { value: 'innerHTML', label: 'Inner HTML' },
    { value: 'outerHTML', label: 'Outer HTML' },
    { value: 'attribute', label: 'Custom attribute' },
];

interface GetterMapInputProps {
    label: string;
    meta: NodalParamDef;
    value: NodeParameterValue | undefined;
    outputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    flowId?: Id;
    readOnly?: boolean;
    invalid?: boolean;
    errorMessage?: string;
    validationIssues?: NodeValidationIssue[];
    onChange: (value: ObjectNodeParameterValue) => void;
}

export default function GetterMapInput({
    label,
    meta,
    value,
    outputData,
    autocompleteContext,
    flowId,
    readOnly,
    invalid,
    errorMessage,
    validationIssues = [],
    onChange,
}: GetterMapInputProps) {
    const objectValue = normalizeObjectParameterValue(value, meta);
    const fields = getObjectFields(objectValue, meta);
    const jsonIssues = objectValue.inputMode === 'json' ? validationIssues : [];
    const hasError = Boolean(invalid || jsonIssues.length > 0);
    const displayedError = errorMessage ?? jsonIssues.map(issue => issue.message).join(' ');

    const addGetter = () => {
        const fieldId = `getter-${Date.now()}`;
        const nextValue = prependCustomObjectField(objectValue, fields, fieldId);
        onChange(updateObjectField(nextValue, nextValue.fields, fieldId, {
            value: { mode: 'fixed', value: 'textContent' },
        }));
    };

    return (
        <ObjectStyles.ObjectField $invalid={hasError}>
            <ObjectStyles.ObjectFieldHeader>
                <div>
                    <ObjectStyles.ObjectFieldLabelLine>
                        <label>{label}</label>
                    </ObjectStyles.ObjectFieldLabelLine>
                    <Shared.NodeFieldHelp>{meta.description}</Shared.NodeFieldHelp>
                    {hasError && (
                        <Shared.NodeFieldError>{displayedError || 'This field is required.'}</Shared.NodeFieldError>
                    )}
                </div>
                <CustomSelect
                    value={objectValue.inputMode}
                    disabled={readOnly}
                    ariaLabel={`${label} input mode`}
                    compact
                    showOptionValue={false}
                    options={OBJECT_INPUT_MODE_OPTIONS}
                    onChange={nextMode => onChange(switchObjectInputMode(
                        objectValue,
                        meta,
                        nextMode === 'form' ? 'form' : 'json',
                    ))}
                />
            </ObjectStyles.ObjectFieldHeader>

            {objectValue.inputMode === 'json' ? (
                <ExpressionInput
                    label="JSON"
                    hint="Map output keys to getter names. Use attribute:name for a custom attribute."
                    placeholder={'{\n  "text": "textContent",\n  "testId": "attribute:data-testid"\n}'}
                    inputType="textarea"
                    value={{ mode: objectValue.jsonMode ?? 'fixed', value: objectValue.value }}
                    outputData={outputData}
                    autocompleteContext={autocompleteContext}
                    flowId={flowId}
                    readOnly={readOnly}
                    onChange={nextValue => onChange({
                        ...objectValue,
                        jsonMode: nextValue.mode,
                        value: nextValue.value,
                    })}
                />
            ) : (
                <S.GetterRows>
                    {fields.map(field => {
                        const getterSpec = normalizeScalarParameterValue(field.value).value || 'textContent';
                        const customAttribute = getterSpec.startsWith('attribute:');
                        const getter = customAttribute ? 'attribute' : getterSpec;
                        const attributeName = customAttribute ? getterSpec.slice('attribute:'.length) : '';
                        const issue = validationIssues.find(candidate => candidate.path === `getters.${field.key}`);

                        return (
                            <S.GetterRow key={field.id} $invalid={Boolean(issue)}>
                                <S.OutputKeyInput
                                    value={field.key}
                                    placeholder="Output key"
                                    disabled={readOnly}
                                    onChange={event => onChange(updateObjectField(
                                        objectValue,
                                        fields,
                                        field.id,
                                        { key: event.target.value },
                                    ))}
                                />
                                <CustomSelect
                                    value={getter}
                                    disabled={readOnly}
                                    compact
                                    compactHeight={34}
                                    showOptionValue={false}
                                    options={GETTER_OPTIONS}
                                    onChange={nextGetter => onChange(updateObjectField(
                                        objectValue,
                                        fields,
                                        field.id,
                                        {
                                            value: {
                                                mode: 'fixed',
                                                value: nextGetter === 'attribute' ? 'attribute:' : nextGetter,
                                            },
                                        },
                                    ))}
                                />
                                {getter === 'attribute' && (
                                    <S.AttributeInput
                                        value={attributeName}
                                        placeholder="Attribute name"
                                        disabled={readOnly}
                                        onChange={event => onChange(updateObjectField(
                                            objectValue,
                                            fields,
                                            field.id,
                                            {
                                                value: {
                                                    mode: 'fixed',
                                                    value: `attribute:${event.target.value}`,
                                                },
                                            },
                                        ))}
                                    />
                                )}
                                <S.RemoveButton
                                    type="button"
                                    title="Remove getter"
                                    disabled={readOnly}
                                    onClick={() => onChange(removeObjectField(objectValue, fields, field.id))}
                                >
                                    <Icon icon="lucide:trash-2" width={13} height={13} />
                                </S.RemoveButton>
                                {issue && <S.RowError>{issue.message}</S.RowError>}
                            </S.GetterRow>
                        );
                    })}
                    <S.AddButton type="button" disabled={readOnly} onClick={addGetter}>
                        <Icon icon="lucide:plus" width={12} height={12} />
                        Add getter
                    </S.AddButton>
                </S.GetterRows>
            )}
        </ObjectStyles.ObjectField>
    );
}
