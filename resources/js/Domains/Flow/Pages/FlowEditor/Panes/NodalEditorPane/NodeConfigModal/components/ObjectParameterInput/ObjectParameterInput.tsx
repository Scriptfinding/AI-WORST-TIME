import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { NodalParamDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import ExpressionInput from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/ExpressionInput/ExpressionInput';
import type { NodeParameterValue, ObjectNodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import type { NodeValidationIssue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/validation';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';
import {
    allowsCustomObjectFields,
    prependCustomObjectField,
    prependKnownObjectField,
    getAvailableObjectFieldKeys,
    getObjectFields,
    isFunctionMap,
    normalizeObjectParameterValue,
    OBJECT_INPUT_MODE_OPTIONS,
    removeObjectField,
    switchObjectInputMode,
    updateObjectField,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/utils/objectParameters';
import ObjectAddControls from './ObjectAddControls/ObjectAddControls';
import ObjectRows from './ObjectRows/ObjectRows';
import * as Shared from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/shared.styled';
import * as S from './styled';

interface ObjectParameterInputProps {
    label: string;
    path: string;
    labelSlot?: ReactNode;
    meta: NodalParamDef;
    value: NodeParameterValue | undefined;
    outputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    currentSiteUrl?: string | null;
    flowId?: Id;
    readOnly?: boolean;
    invalid?: boolean;
    errorMessage?: string;
    validationIssues?: NodeValidationIssue[];
    onRemove?: () => void;
    onChange: (value: ObjectNodeParameterValue) => void;
}

export default function ObjectParameterInput({
    label,
    path,
    labelSlot,
    meta,
    value,
    outputData,
    autocompleteContext,
    currentSiteUrl,
    flowId,
    readOnly,
    invalid,
    errorMessage,
    validationIssues = [],
    onRemove,
    onChange,
}: ObjectParameterInputProps) {
    const { confirm, ConfirmModal } = useConfirm();
    const objectFieldRef = useRef<HTMLDivElement | null>(null);
    const pendingFocusFieldIdRef = useRef<string | null>(null);
    const objectValue = normalizeObjectParameterValue(value, meta);
    const fields = getObjectFields(objectValue, meta);
    const allowCustomFields = allowsCustomObjectFields(meta);
    const functionMap = isFunctionMap(meta);
    const availableFieldKeys = getAvailableObjectFieldKeys(fields, meta);
    const jsonValidationIssues = objectValue.inputMode === 'json' ? validationIssues : [];
    const flowValidationIssues = validationIssues.filter(issue => issue.kind === 'connect-flow');
    const objectInvalid = Boolean(invalid || jsonValidationIssues.length > 0 || flowValidationIssues.length > 0);
    const objectErrorMessage = errorMessage
        ?? (objectValue.inputMode === 'json' ? jsonValidationIssues : flowValidationIssues)
            .map(issue => issue.message).join(' ');

    useEffect(() => {
        const fieldId = pendingFocusFieldIdRef.current;
        if (!fieldId) return;

        const frameId = window.requestAnimationFrame(() => {
            const input = objectFieldRef.current?.querySelector<HTMLInputElement>(
                `[data-object-key-input="${fieldId}"]`,
            );

            if (!input) return;

            input.scrollIntoView({ block: 'center', behavior: 'smooth' });
            input.focus({ preventScroll: true });
            pendingFocusFieldIdRef.current = null;
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [fields]);

    const addField = (key: string) => {
        if (!key) return;
        onChange(prependKnownObjectField(objectValue, fields, meta, key));
    };

    const addCustomField = () => {
        const fieldId = `custom-${Date.now()}`;
        pendingFocusFieldIdRef.current = fieldId;
        onChange(prependCustomObjectField(objectValue, fields, fieldId, meta));
    };

    const confirmRemoval = async (optionLabel: string, remove: () => void) => {
        const confirmed = await confirm({
            title: 'Remove option?',
            message: (
                <>
                    Are you sure you want to remove <strong>{optionLabel}</strong> from this node?
                </>
            ),
            confirmLabel: 'Remove',
            variant: 'danger',
        });

        if (confirmed) remove();
    };

    const removeField = (fieldId: string) => {
        const field = fields.find(candidate => candidate.id === fieldId);
        if (!field) return;

        const optionLabel = meta.objectFields?.[field.key]?.label ?? field.key;
        void confirmRemoval(optionLabel, () => onChange(
            removeObjectField(objectValue, fields, fieldId),
        ));
    };

    return (
        <>
            <S.ObjectField ref={objectFieldRef} $invalid={objectInvalid}>
                <S.ObjectFieldHeader>
                    <div>
                        <S.ObjectFieldLabelLine>
                            {onRemove && (
                                <S.ObjectInlineRemoveButton
                                    type="button"
                                    disabled={readOnly}
                                    title="Remove input"
                                    onClick={event => {
                                        event.stopPropagation();
                                        void confirmRemoval(label, onRemove);
                                    }}
                                >
                                    <Icon icon="lucide:trash-2" width={13} height={13} />
                                    <S.ObjectInlineRemoveButtonLabel>Supprimer</S.ObjectInlineRemoveButtonLabel>
                                </S.ObjectInlineRemoveButton>
                            )}
                            {labelSlot ?? <label>{label}</label>}
                        </S.ObjectFieldLabelLine>
                        <Shared.NodeFieldHelp>{meta.description}</Shared.NodeFieldHelp>
                        {objectInvalid && (
                            <Shared.NodeFieldError>{objectErrorMessage || 'This field is required.'}</Shared.NodeFieldError>
                        )}
                    </div>
                    {!functionMap && (
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
                    )}
                </S.ObjectFieldHeader>

                {objectValue.inputMode === 'json' ? (
                    <ExpressionInput
                        label="JSON"
                        hint="Write a fixed JSON object, or switch to Expression to build this object dynamically."
                        placeholder={meta.placeholder ?? '{\n  "timeout": 30000\n}'}
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
                    <S.ObjectFormRows>
                        <ObjectAddControls
                            availableFieldKeys={availableFieldKeys}
                            meta={meta}
                            allowCustomFields={allowCustomFields}
                            readOnly={readOnly}
                            onAddField={addField}
                            onAddCustomField={addCustomField}
                        />
                        <ObjectRows
                            fields={fields}
                            path={path}
                            meta={meta}
                            validationIssues={validationIssues}
                            allowCustomFields={allowCustomFields}
                            outputData={outputData}
                            autocompleteContext={autocompleteContext}
                            currentSiteUrl={currentSiteUrl}
                            flowId={flowId}
                            readOnly={readOnly}
                            onUpdateField={(fieldId, patch) => onChange(
                                updateObjectField(objectValue, fields, fieldId, patch),
                            )}
                            onRemoveField={removeField}
                            renderNestedObject={(field, nestedMeta, nestedLabelSlot) => (
                                <ObjectParameterInput
                                    label={nestedMeta.label ?? 'Value'}
                                    path={`${path}.${field.key}`}
                                    labelSlot={nestedLabelSlot}
                                    meta={nestedMeta}
                                    value={field.value}
                                    outputData={outputData}
                                    autocompleteContext={autocompleteContext}
                                    currentSiteUrl={currentSiteUrl}
                                    flowId={flowId}
                                    readOnly={readOnly}
                                    validationIssues={validationIssues.filter(
                                        issue => issue.path.startsWith(`${path}.${field.key}.`),
                                    )}
                                    onRemove={nestedMeta.required ? undefined : () => onChange(
                                        removeObjectField(objectValue, fields, field.id),
                                    )}
                                    onChange={nextValue => onChange(
                                        updateObjectField(objectValue, fields, field.id, { value: nextValue }),
                                    )}
                                />
                            )}
                        />
                    </S.ObjectFormRows>
                )}
            </S.ObjectField>
            <ConfirmModal />
        </>
    );
}
