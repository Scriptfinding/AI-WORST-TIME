import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import { useGrabber } from '@/Domains/Flow/Pages/FlowEditor/Grabber/GrabberContext';
import type { CanvasNode, NodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import {
    getParameterHint,
    getParameterMeta,
    isObjectLikeParam,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/catalog';
import {
    IF_ELSE_NODE_NAME,
    LOOP_NODE_NAME,
    MERGE_NODE_NAME,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import { normalizeScalarParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/expression';
import {
    getUnavailableBrowserTabIssue,
    getNodeParameterDisplayLabel,
    type NodeValidationIssue,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/validation';
import ExpressionInput from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/ExpressionInput/ExpressionInput';
import { getExpressionInputType, isObjectInput } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/utils/objectParameters';
import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';
import IfConditionBuilder from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/IfConditionBuilder/IfConditionBuilder';
import ObjectParameterInput from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/ObjectParameterInput/ObjectParameterInput';
import GetterMapInput from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/GetterMapInput/GetterMapInput';
import AiModelSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/AiModelSelect/AiModelSelect';
import * as S from '../shared.styled';

const LOOP_MODE_OPTIONS = [
    { value: 'items', label: 'Items' },
    { value: 'iterations', label: 'Iterations' },
    { value: 'condition', label: 'Condition' },
];

const MERGE_STRATEGY_OPTIONS = [
    { value: 'append', label: 'Append arrays/items' },
    { value: 'firstNonEmpty', label: 'First non-empty' },
    { value: 'objectAssign', label: 'Object assign' },
];

interface NodeParameterFieldProps {
    arg: string;
    node: CanvasNode;
    entry: HelpEntryDef;
    expressionOutputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    missingRequiredIssue?: NodeValidationIssue;
    nestedRequiredIssues?: NodeValidationIssue[];
    currentSiteUrl?: string | null;
    flowId?: Id;
    readOnly?: boolean;
    onUpdateValue: (nodeId: string, key: string, value: NodeParameterValue) => void;
}

export default function NodeParameterField({
    arg,
    node,
    entry,
    expressionOutputData,
    autocompleteContext,
    missingRequiredIssue,
    nestedRequiredIssues,
    currentSiteUrl,
    flowId,
    readOnly,
    onUpdateValue,
}: NodeParameterFieldProps) {
    const hint = getParameterHint(entry, arg);
    const meta = getParameterMeta(entry, arg);
    const cleanArg = arg.replace(/\?$/, '').replace(/^\.\.\./, '');
    const fieldLabel = getNodeParameterDisplayLabel(entry, cleanArg);
    const isTabName = meta.input === 'tab-name';
    const tabNameOptions = isTabName
        ? autocompleteContext.tabNames.map(tabName => ({ value: tabName, label: tabName }))
        : meta.options;
    const scalarValue = normalizeScalarParameterValue(node.values[cleanArg]);
    const unavailableTabIssue = getUnavailableBrowserTabIssue(
        entry,
        node.values,
        autocompleteContext.tabNames,
    );
    const invalid = Boolean(missingRequiredIssue || unavailableTabIssue);
    const errorMessage = unavailableTabIssue?.message ?? missingRequiredIssue?.message;
    const { available: grabberAvailable, grabSelector } = useGrabber();
    const [grabbing, setGrabbing] = useState(false);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressTriggeredRef = useRef(false);

    useEffect(() => () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    }, []);

    if (meta.valueType === 'flow') return null;

    if (entry.name === IF_ELSE_NODE_NAME && cleanArg === 'condition') {
        return (
            <IfConditionBuilder
                value={node.values[cleanArg]}
                outputData={expressionOutputData}
                autocompleteContext={autocompleteContext}
                readOnly={readOnly}
                onChange={value => onUpdateValue(node.id, cleanArg, value)}
            />
        );
    }

    if (entry.name === LOOP_NODE_NAME && arg === 'mode') {
        return (
            <S.SelectField>
                <label>{fieldLabel}</label>
                {hint && <S.FieldHelp>{hint}</S.FieldHelp>}
                <CustomSelect
                    value={normalizeScalarParameterValue(node.values[cleanArg]).value || 'items'}
                    disabled={readOnly}
                    options={LOOP_MODE_OPTIONS}
                    onChange={value => onUpdateValue(node.id, cleanArg, { mode: 'fixed', value })}
                />
            </S.SelectField>
        );
    }

    if (entry.name === MERGE_NODE_NAME && arg === 'strategy') {
        return (
            <S.SelectField>
                <label>{fieldLabel}</label>
                {hint && <S.FieldHelp>{hint}</S.FieldHelp>}
                <CustomSelect
                    value={normalizeScalarParameterValue(node.values[cleanArg]).value || 'append'}
                    disabled={readOnly}
                    options={MERGE_STRATEGY_OPTIONS}
                    onChange={value => onUpdateValue(node.id, cleanArg, { mode: 'fixed', value })}
                />
            </S.SelectField>
        );
    }

    if (
        meta.input === 'ai-model'
        || meta.input === 'ai-vision-model'
    ) {
        const value = normalizeScalarParameterValue(node.values[cleanArg]);
        const createCapability = entry.name === '$aiControl'
            ? 'vision'
            : entry.name === '$aiMessage'
                ? 'text'
                : undefined;
        return (
            <ExpressionInput
                label={fieldLabel}
                hint={hint}
                value={value}
                outputData={expressionOutputData}
                autocompleteContext={autocompleteContext}
                flowId={flowId}
                readOnly={readOnly}
                invalid={Boolean(missingRequiredIssue)}
                errorMessage={missingRequiredIssue?.message}
                fixedInput={(
                    <AiModelSelect
                        kind={meta.input}
                        value={value.value}
                        disabled={readOnly}
                        invalid={Boolean(missingRequiredIssue)}
                        createCapability={createCapability}
                        onChange={nextValue => onUpdateValue(
                            node.id,
                            cleanArg,
                            { mode: 'fixed', value: nextValue },
                        )}
                    />
                )}
                onChange={nextValue => onUpdateValue(node.id, cleanArg, nextValue)}
            />
        );
    }

    if (meta.input === 'getter-map' || meta.valueType === 'getter-map') {
        return (
            <GetterMapInput
                label={fieldLabel}
                meta={meta}
                value={node.values[cleanArg]}
                outputData={expressionOutputData}
                autocompleteContext={autocompleteContext}
                flowId={flowId}
                readOnly={readOnly}
                invalid={Boolean(missingRequiredIssue)}
                errorMessage={missingRequiredIssue?.message}
                validationIssues={nestedRequiredIssues}
                onChange={value => onUpdateValue(node.id, cleanArg, value)}
            />
        );
    }

    if (isObjectInput(meta) || isObjectLikeParam(arg)) {
        return (
            <ObjectParameterInput
                label={fieldLabel}
                path={cleanArg}
                meta={meta}
                value={node.values[cleanArg]}
                outputData={expressionOutputData}
                autocompleteContext={autocompleteContext}
                currentSiteUrl={currentSiteUrl}
                flowId={flowId}
                readOnly={readOnly}
                invalid={Boolean(missingRequiredIssue)}
                errorMessage={missingRequiredIssue?.message}
                validationIssues={nestedRequiredIssues}
                onChange={value => onUpdateValue(node.id, cleanArg, value)}
            />
        );
    }

    const handleGrab = async (forceOnboarding = false) => {
        if (readOnly || grabbing) return;
        setGrabbing(true);
        try {
            const result = await grabSelector(currentSiteUrl, { forceOnboarding });
            onUpdateValue(node.id, cleanArg, { mode: 'fixed', value: result.selector });
        } catch {
            // The coordinator displays actionable errors and cancellation feedback.
        } finally {
            setGrabbing(false);
        }
    };
    const stopLongPress = () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
    };
    const startLongPress = () => {
        if (readOnly || grabbing) return;
        stopLongPress();
        longPressTriggeredRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
            longPressTriggeredRef.current = true;
            void handleGrab(true);
        }, 550);
    };

    return (
        <ExpressionInput
            label={fieldLabel}
            labelSlot={meta.picker === 'selector' ? (
                <S.PickerLabel>
                    <label>{fieldLabel}</label>
                    <S.PickerButton
                        type="button"
                        disabled={readOnly || grabbing}
                        $active={grabbing}
                        title={grabberAvailable
                            ? 'Pick a selector. Shift-click or hold to show the introduction.'
                            : 'Connect or install Puppetflow Grabber'}
                        onPointerDown={startLongPress}
                        onPointerUp={stopLongPress}
                        onPointerCancel={stopLongPress}
                        onPointerLeave={stopLongPress}
                        onClick={event => {
                            if (longPressTriggeredRef.current) {
                                longPressTriggeredRef.current = false;
                                event.preventDefault();
                                return;
                            }
                            void handleGrab(event.shiftKey);
                        }}
                    >
                        <Icon icon={grabbing ? 'lucide:scan-search' : 'lucide:crosshair'} width={13} height={13} />
                        {grabbing ? 'Picking...' : 'Grab'}
                    </S.PickerButton>
                </S.PickerLabel>
            ) : undefined}
            hint={hint}
            placeholder={isTabName ? 'Default' : meta.placeholder}
            inputType={getExpressionInputType(meta)}
            options={tabNameOptions}
            allowCustomSelectValue={isTabName && entry.name === '$gotoUrl'}
            value={scalarValue}
            outputData={expressionOutputData}
            autocompleteContext={autocompleteContext}
            flowId={flowId}
            readOnly={readOnly}
            invalid={invalid}
            errorMessage={errorMessage}
            onChange={value => onUpdateValue(node.id, cleanArg, value)}
        />
    );
}
