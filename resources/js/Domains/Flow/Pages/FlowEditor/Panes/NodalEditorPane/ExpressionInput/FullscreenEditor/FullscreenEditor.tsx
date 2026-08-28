import type { DragEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Editor, { type OnMount } from '@monaco-editor/react';
import DataInspector from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/DataInspector/DataInspector';
import type { ScalarNodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import ExpressionPreview from '../ExpressionPreview/ExpressionPreview';
import { CODE_INPUT_EDITOR_OPTIONS, EXPRESSION_FULLSCREEN_EDITOR_OPTIONS, PLAIN_FIXED_INPUT_EDITOR_OPTIONS } from '../utils';
import * as S from './styled';

interface FullscreenEditorProps {
    label: string;
    inputType: string;
    value: ScalarNodeParameterValue;
    placeholder?: string;
    outputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    theme: string;
    readOnly?: boolean;
    renderedExpression: { ok: true; value: unknown } | { ok: false; error: string };
    onClose: () => void;
    onMount: OnMount;
    onChange: (value: string) => void;
    onDropPath: (path: string, event?: DragEvent<HTMLElement>) => void;
}

export default function FullscreenEditor({
    label,
    inputType,
    value,
    placeholder,
    outputData,
    autocompleteContext,
    theme,
    readOnly,
    renderedExpression,
    onClose,
    onMount,
    onChange,
    onDropPath,
}: FullscreenEditorProps) {
    const contextData = autocompleteContext.contextData && typeof autocompleteContext.contextData === 'object'
        ? autocompleteContext.contextData as Record<string, unknown>
        : {};
    const inputData = autocompleteContext.inputData && typeof autocompleteContext.inputData === 'object'
        ? autocompleteContext.inputData as Record<string, unknown>
        : {};

    return (
        <S.ExpressionFullscreenBackdrop
            data-modal-overlay
            data-modal-kind="expression-fullscreen"
            onClick={onClose}
            onWheel={event => event.stopPropagation()}
            onPointerDown={event => event.stopPropagation()}
        >
            <S.ExpressionFullscreenPanel onClick={event => event.stopPropagation()}>
                <S.ExpressionFullscreenHeader>
                    <div>
                        <strong>{label}</strong>
                        <span>
                            {value.mode === 'expression'
                                ? 'Expression editor'
                                : inputType === 'code' ? 'Code editor' : 'Fixed value editor'}
                        </span>
                    </div>
                    <S.ClosePicker type="button" onClick={onClose} title="Close">
                        <Icon icon="lucide:x" width={16} height={16} />
                    </S.ClosePicker>
                </S.ExpressionFullscreenHeader>
                <S.ExpressionFullscreenBody $codeInput={inputType === 'code'}>
                    <DataInspector
                        title="Scope"
                        value={{
                            $input: inputData,
                            $nodes: autocompleteContext.nodeData ?? {},
                            $run: autocompleteContext.runData ?? {},
                            $output: outputData ?? {},
                            $context: contextData,
                            $viewportWidth: inputData.$viewportWidth ?? 1280,
                            $viewportHeight: inputData.$viewportHeight ?? 720,
                        }}
                        rootPath="$"
                        emptyText="No scope data yet."
                    />
                    <S.ExpressionFullscreenEditor
                        onDragOver={event => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={event => {
                            event.preventDefault();
                            onDropPath(event.dataTransfer.getData('text/plain'), event);
                        }}
                    >
                        <Editor
                            height="100%"
                            language={value.mode === 'expression' || inputType === 'code' ? 'javascript' : inputType === 'textarea' ? 'json' : 'plaintext'}
                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                            defaultValue={value.value}
                            options={{
                                ...EXPRESSION_FULLSCREEN_EDITOR_OPTIONS,
                                placeholder,
                                readOnly,
                                domReadOnly: readOnly,
                                ...(inputType === 'code'
                                    ? CODE_INPUT_EDITOR_OPTIONS
                                    : value.mode === 'fixed' ? PLAIN_FIXED_INPUT_EDITOR_OPTIONS : {}),
                            }}
                            onMount={onMount}
                            onChange={nextValue => onChange(nextValue ?? '')}
                        />
                    </S.ExpressionFullscreenEditor>
                    {inputType !== 'code' && (
                        <S.ExpressionRenderPanel>
                            <S.ExpressionRenderHeader>
                                <strong>Result</strong>
                                <span>Rendered expression</span>
                            </S.ExpressionRenderHeader>
                            <S.ExpressionRenderBody $error={!renderedExpression.ok}>
                                {renderedExpression.ok ? (
                                    <ExpressionPreview value={renderedExpression.value} />
                                ) : (
                                    <pre>{renderedExpression.error}</pre>
                                )}
                            </S.ExpressionRenderBody>
                        </S.ExpressionRenderPanel>
                    )}
                </S.ExpressionFullscreenBody>
            </S.ExpressionFullscreenPanel>
        </S.ExpressionFullscreenBackdrop>
    );
}
