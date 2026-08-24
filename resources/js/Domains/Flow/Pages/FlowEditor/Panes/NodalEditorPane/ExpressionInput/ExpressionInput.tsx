import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useThemeMode } from '@/App/Hooks/useThemeMode';
import type { NodalSelectOption } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { ScalarNodeParameterValue } from '../types';
import type { NodalAutocompleteContext } from '../utils/staticAnalysis';
import ExpressionEditorShell from './ExpressionEditorShell';
import FixedInputRenderer, {
    type ExpressionInputType,
} from './FixedInputRenderer';
import FullscreenEditor from './FullscreenEditor/FullscreenEditor';
import { useExpressionEditors } from './useExpressionEditors';
import { useExpressionInputOrchestration } from './useExpressionInputOrchestration';
import {
    asRecord,
    capitalizeLabel,
    DEFAULT_SELECT_SEARCH_THRESHOLD,
} from './utils';
import * as S from './styled';

interface ExpressionInputProps {
    label: string;
    labelSlot?: ReactNode;
    hint?: string | null;
    placeholder?: string;
    inputType?: ExpressionInputType;
    options?: NodalSelectOption[];
    allowCustomSelectValue?: boolean;
    selectSearchThreshold?: number;
    flowId?: Id;
    value: ScalarNodeParameterValue;
    outputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    readOnly?: boolean;
    inlineLabel?: boolean;
    invalid?: boolean;
    errorMessage?: string;
    fixedInput?: ReactNode;
    onRemove?: () => void;
    onChange: (value: ScalarNodeParameterValue) => void;
}

export default function ExpressionInput({
    label,
    labelSlot,
    hint,
    placeholder,
    inputType = 'text',
    options = [],
    allowCustomSelectValue,
    selectSearchThreshold = DEFAULT_SELECT_SEARCH_THRESHOLD,
    flowId,
    value,
    outputData,
    autocompleteContext,
    readOnly,
    inlineLabel,
    invalid,
    errorMessage,
    fixedInput,
    onRemove,
    onChange,
}: ExpressionInputProps) {
    const { resolved: theme } = useThemeMode();
    const fieldRef = useRef<HTMLDivElement | null>(null);
    const variableCursorOffsetRef = useRef<number | null>(null);
    const pendingVariableCursorOffsetRef = useRef<number | null>(null);
    const isExpressionMode = value.mode === 'expression';
    const autocompleteOutputData = useMemo(() => asRecord(outputData), [outputData]);
    const {
        handleFixedTextareaEditorMount,
        handleFullscreenEditorMount,
        handleInlineEditorMount,
        inlineEditorHeight,
        inlineEditorRef,
        refreshInlineExpressionCompletions,
        updateExpression,
        updateFixedValue,
        updateFullscreenValue,
    } = useExpressionEditors({
        autocompleteContext,
        autocompleteOutputData,
        inputType,
        isExpressionMode,
        value,
        onChange,
    });
    const {
        channelSuggestions,
        channelSuggestionsLoading,
        expanded,
        insertDraggedPath,
        onBlur,
        onClose,
        onDragOver,
        onDrop,
        onExpand,
        onFocus,
        renderedExpression,
        refreshSuggestions,
        renderVisible,
        watcherSuggestions,
        watcherSuggestionsLoading,
    } = useExpressionInputOrchestration({
        autocompleteContext,
        flowId,
        inputType,
        outputData,
        value,
        refreshInlineExpressionCompletions,
        updateExpression,
    });
    const handleModeChange = (nextValue: ScalarNodeParameterValue) => {
        const modeChanged = nextValue.mode !== value.mode;
        onChange(nextValue);
        if (!modeChanged) return;

        requestAnimationFrame(() => {
            if (nextValue.mode === 'expression') {
                inlineEditorRef.current?.focus();
                return;
            }

            const input = fieldRef.current?.querySelector<HTMLElement>(
                'input:not([type="hidden"]), textarea, select, [role="combobox"]',
            );
            if (input) {
                input.focus();
                return;
            }

            inlineEditorRef.current?.focus();
        });
    };

    const captureVariableCursor = () => {
        const currentEditor = inlineEditorRef.current;
        const editorModel = currentEditor?.getModel();
        const editorPosition = currentEditor?.getPosition();
        if (currentEditor?.hasTextFocus() && editorModel && editorPosition) {
            variableCursorOffsetRef.current = editorModel.getOffsetAt(editorPosition);
            return;
        }

        const activeElement = document.activeElement;
        if (
            activeElement instanceof HTMLInputElement
            && fieldRef.current?.contains(activeElement)
            && typeof activeElement.selectionStart === 'number'
        ) {
            variableCursorOffsetRef.current = activeElement.selectionStart;
            return;
        }

        if (editorModel && editorPosition) {
            variableCursorOffsetRef.current = editorModel.getOffsetAt(editorPosition);
            return;
        }

        variableCursorOffsetRef.current = value.value.length;
    };

    const insertVariable = (key: string) => {
        const currentValue = value.value;
        const offset = Math.max(0, Math.min(
            variableCursorOffsetRef.current ?? currentValue.length,
            currentValue.length,
        ));
        const prefix = currentValue.slice(0, offset);
        const insideExpression = prefix.lastIndexOf('{{') > prefix.lastIndexOf('}}');
        const variableCall = `$vars(${JSON.stringify(key)})`;
        const insertion = insideExpression ? variableCall : `{{ ${variableCall} }}`;
        const nextValue = currentValue.slice(0, offset) + insertion + currentValue.slice(offset);

        pendingVariableCursorOffsetRef.current = offset + insertion.length;
        onChange({ mode: 'expression', value: nextValue });
    };

    useEffect(() => {
        const offset = pendingVariableCursorOffsetRef.current;
        if (!isExpressionMode || offset === null) return;

        const frame = requestAnimationFrame(() => {
            const currentEditor = inlineEditorRef.current;
            const model = currentEditor?.getModel();
            if (!currentEditor || !model) return;

            const position = model.getPositionAt(Math.min(offset, model.getValueLength()));
            currentEditor.setPosition(position);
            currentEditor.revealPositionInCenterIfOutsideViewport(position);
            currentEditor.focus();
            pendingVariableCursorOffsetRef.current = null;
            variableCursorOffsetRef.current = null;
        });

        return () => cancelAnimationFrame(frame);
    }, [isExpressionMode, inlineEditorRef, value.value]);

    return (
        <S.ExpressionField
            ref={fieldRef}
            $inlineLabel={inlineLabel}
            $invalid={invalid}
            data-invalid={invalid}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <S.NodeFieldHeader>
                {onRemove && (
                    <S.NodeFieldRemoveButton
                        type="button"
                        disabled={readOnly}
                        title="Remove input"
                        onClick={event => {
                            event.stopPropagation();
                            onRemove();
                        }}
                    >
                        <Icon icon="lucide:trash-2" width={13} height={13} />
                        <S.NodeFieldRemoveButtonLabel>Supprimer</S.NodeFieldRemoveButtonLabel>
                    </S.NodeFieldRemoveButton>
                )}
                {labelSlot ?? <label>{capitalizeLabel(label)}</label>}
            </S.NodeFieldHeader>
            {hint && <S.NodeFieldHelp>{hint}</S.NodeFieldHelp>}
            {invalid && (
                <S.NodeFieldError>{errorMessage ?? 'This field is required.'}</S.NodeFieldError>
            )}
            {isExpressionMode ? (
                <ExpressionEditorShell
                    value={value}
                    renderedExpression={renderedExpression}
                    renderVisible={renderVisible}
                    inlineEditorHeight={inlineEditorHeight}
                    theme={theme}
                    readOnly={readOnly}
                    onExpand={onExpand}
                    onChange={handleModeChange}
                    onEditorMount={handleInlineEditorMount}
                    onEditorChange={nextValue => updateExpression(
                        nextValue,
                        inlineEditorRef.current,
                    )}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onVariablePickerOpen={captureVariableCursor}
                    onVariableSelect={insertVariable}
                />
            ) : (
                <FixedInputRenderer
                    inputType={inputType}
                    value={value}
                    options={options}
                    allowCustomSelectValue={allowCustomSelectValue}
                    selectSearchThreshold={selectSearchThreshold}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    theme={theme}
                    inlineEditorHeight={inlineEditorHeight}
                    channelSuggestions={channelSuggestions}
                    channelSuggestionsLoading={channelSuggestionsLoading}
                    watcherSuggestions={watcherSuggestions}
                    watcherSuggestionsLoading={watcherSuggestionsLoading}
                    fixedInput={fixedInput}
                    onExpand={onExpand}
                    onChange={handleModeChange}
                    onTextareaMount={handleFixedTextareaEditorMount}
                    onTextareaChange={nextValue => updateFixedValue(
                        nextValue,
                        inlineEditorRef.current,
                    )}
                    onVariablePickerOpen={captureVariableCursor}
                    onVariableSelect={insertVariable}
                    onRefreshSuggestions={refreshSuggestions}
                />
            )}
            {expanded && (
                <FullscreenEditor
                    label={label}
                    inputType={inputType}
                    value={value}
                    placeholder={placeholder}
                    outputData={outputData}
                    autocompleteContext={autocompleteContext}
                    theme={theme}
                    readOnly={readOnly}
                    renderedExpression={renderedExpression}
                    onClose={onClose}
                    onMount={handleFullscreenEditorMount}
                    onChange={updateFullscreenValue}
                    onDropPath={insertDraggedPath}
                />
            )}
        </S.ExpressionField>
    );
}
