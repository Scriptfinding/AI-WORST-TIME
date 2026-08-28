import Editor, { type OnMount } from '@monaco-editor/react';
import type { ScalarNodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import EditorActions from './EditorActions/EditorActions';
import ExpressionPreview from './ExpressionPreview/ExpressionPreview';
import {
    EXPRESSION_EDITOR_OPTIONS,
    EXPRESSION_MAX_HEIGHT,
    EXPRESSION_OVERFLOW_SCROLLBAR_OPTIONS,
} from './utils';
import * as S from './ExpressionEditorShell.styled';
import * as Shared from './shared.styled';

interface ExpressionEditorShellProps {
    value: ScalarNodeParameterValue;
    renderedExpression: { ok: true; value: unknown } | { ok: false; error: string };
    renderVisible: boolean;
    inlineEditorHeight: number;
    theme: string;
    readOnly?: boolean;
    onExpand: () => void;
    onChange: (value: ScalarNodeParameterValue) => void;
    onEditorMount: OnMount;
    onEditorChange: (value: string) => void;
    onFocus: () => void;
    onBlur: () => void;
    onVariablePickerOpen: () => void;
    onVariableSelect: (key: string) => void;
}

export default function ExpressionEditorShell({
    value,
    renderedExpression,
    renderVisible,
    inlineEditorHeight,
    theme,
    readOnly,
    onExpand,
    onChange,
    onEditorMount,
    onEditorChange,
    onFocus,
    onBlur,
    onVariablePickerOpen,
    onVariableSelect,
}: ExpressionEditorShellProps) {
    return (
        <Shared.ExpressionEditorWrap
            onFocusCapture={onFocus}
            onBlurCapture={event => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                onBlur();
            }}
        >
            <EditorActions
                value={value}
                readOnly={readOnly}
                fullscreenTitle="Open fullscreen expression editor"
                onExpand={onExpand}
                onChange={onChange}
                onVariablePickerOpen={onVariablePickerOpen}
                onVariableSelect={onVariableSelect}
            />
            <Shared.ExpressionCodeEditor
                $renderVisible={renderVisible}
                style={{ height: inlineEditorHeight }}
            >
                <Editor
                    key="inline-expression"
                    height={`${inlineEditorHeight}px`}
                    language="javascript"
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    defaultValue={value.value}
                    options={{
                        ...EXPRESSION_EDITOR_OPTIONS,
                        ...(inlineEditorHeight >= EXPRESSION_MAX_HEIGHT
                            ? EXPRESSION_OVERFLOW_SCROLLBAR_OPTIONS
                            : {}),
                        readOnly,
                        domReadOnly: readOnly,
                    }}
                    onMount={onEditorMount}
                    onChange={nextValue => onEditorChange(nextValue ?? '')}
                />
            </Shared.ExpressionCodeEditor>
            {renderVisible && (
                <S.ExpressionInlineRender
                    tabIndex={0}
                    $error={!renderedExpression.ok}
                >
                    {renderedExpression.ok
                        ? <ExpressionPreview value={renderedExpression.value} />
                        : <pre>{renderedExpression.error}</pre>}
                </S.ExpressionInlineRender>
            )}
        </Shared.ExpressionEditorWrap>
    );
}
