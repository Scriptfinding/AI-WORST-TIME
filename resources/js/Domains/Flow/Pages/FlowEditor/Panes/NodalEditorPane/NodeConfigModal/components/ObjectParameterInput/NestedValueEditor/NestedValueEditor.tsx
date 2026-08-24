import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { NodalParamDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import { useGrabber } from '@/Domains/Flow/Pages/FlowEditor/Grabber/GrabberContext';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import type {
    NodeParameterValue,
    ObjectFieldValueType,
    ObjectNodeParameterField,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { normalizeScalarParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/expression';
import ExpressionInput from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/ExpressionInput/ExpressionInput';
import {
    getObjectFieldInputType,
    isObjectInput,
    NESTED_OBJECT_FIELD_META,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/utils/objectParameters';
import * as Shared from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/NodeParameters/shared.styled';
import * as S from './styled';

export type RenderNestedObject = (
    field: ObjectNodeParameterField,
    meta: NodalParamDef,
    labelSlot: ReactNode,
) => ReactNode;

interface NestedValueEditorProps {
    field: ObjectNodeParameterField;
    meta?: NodalParamDef;
    valueType: ObjectFieldValueType;
    labelSlot: ReactNode;
    outputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    currentSiteUrl?: string | null;
    flowId?: Id;
    readOnly?: boolean;
    invalid?: boolean;
    errorMessage?: string;
    onRemove?: () => void;
    onChange: (value: NodeParameterValue) => void;
    renderNestedObject: RenderNestedObject;
}

export default function NestedValueEditor({
    field,
    meta,
    valueType,
    labelSlot,
    outputData,
    autocompleteContext,
    currentSiteUrl,
    flowId,
    readOnly,
    invalid,
    errorMessage,
    onRemove,
    onChange,
    renderNestedObject,
}: NestedValueEditorProps) {
    const { available: grabberAvailable, grabSelector } = useGrabber();
    const [grabbing, setGrabbing] = useState(false);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressTriggeredRef = useRef(false);
    const grabLabel = meta?.label ?? field.key ?? 'Value';

    useEffect(() => () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    }, []);

    const handleGrab = async (forceOnboarding = false) => {
        if (readOnly || grabbing) return;
        setGrabbing(true);
        try {
            const result = await grabSelector(currentSiteUrl, { forceOnboarding });
            onChange({ mode: 'fixed', value: result.selector });
        } catch {
            // The coordinator owns user-facing failure feedback.
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

    const pickerLabelSlot = meta?.picker === 'selector' ? (
        <Shared.PickerLabel>
            <label>{grabLabel}</label>
            <Shared.PickerButton
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
            </Shared.PickerButton>
        </Shared.PickerLabel>
    ) : labelSlot;

    return (
        <S.ValueColumn>
            {isObjectInput(meta) ? (
                renderNestedObject(field, meta ?? NESTED_OBJECT_FIELD_META, pickerLabelSlot)
            ) : (
                <ExpressionInput
                    label={meta?.label ?? 'Value'}
                    labelSlot={pickerLabelSlot}
                    hint={meta?.description}
                    placeholder={meta?.placeholder}
                    inputType={getObjectFieldInputType(valueType, meta)}
                    options={meta?.options}
                    value={normalizeScalarParameterValue(field.value)}
                    outputData={outputData}
                    autocompleteContext={autocompleteContext}
                    flowId={flowId}
                    readOnly={readOnly}
                    invalid={invalid}
                    errorMessage={errorMessage}
                    onRemove={onRemove}
                    onChange={onChange}
                />
            )}
        </S.ValueColumn>
    );
}
