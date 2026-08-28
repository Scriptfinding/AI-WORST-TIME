import { useCallback, useEffect, useRef, useState } from 'react';
import type { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { registerAiModelCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/aiModelSuggestions';
import { registerChannelCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/channelSuggestions';
import { registerDataTableCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/dataTableSuggestions';
import { registerCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/monacoBase';
import { registerNodalAutocompleteCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/inputCompletions';
import { registerReferenceLabelDecorations } from '@/Domains/Flow/Pages/FlowEditor/utils/referenceLabelDecorations';
import { registerSnippetCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/snippetSuggestions';
import { registerVarsCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/variableSuggestions';
import { registerTabNameCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/tabNameSuggestions';
import type { ScalarNodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import {
    EXPRESSION_MAX_HEIGHT,
    EXPRESSION_MIN_HEIGHT,
    registerTemplateDecorations,
} from './utils';

interface UseExpressionEditorsOptions {
    autocompleteContext: NodalAutocompleteContext;
    autocompleteOutputData: Record<string, unknown> | null;
    inputType: string;
    isExpressionMode: boolean;
    flowId?: Id;
    value: ScalarNodeParameterValue;
    onChange: (value: ScalarNodeParameterValue) => void;
}

// Keeps the inline and fullscreen Monaco expression editors synchronized.
export function useExpressionEditors({
    autocompleteContext,
    autocompleteOutputData,
    inputType,
    isExpressionMode,
    flowId,
    value,
    onChange,
}: UseExpressionEditorsOptions) {
    const [inlineEditorHeight, setInlineEditorHeight] = useState(EXPRESSION_MIN_HEIGHT);
    const inlineEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const fullscreenEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
    const completionModelUriRef = useRef<string | null>(null);
    const lastChangedEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const isInternalChangeRef = useRef(false);
    const completionDisposablesRef = useRef<{ dispose: () => void }[]>([]);

    const disposeCompletions = useCallback(() => {
        completionDisposablesRef.current.forEach(disposable => disposable.dispose());
        completionDisposablesRef.current = [];
    }, []);

    const registerExpressionCompletions = useCallback((
        monaco: Parameters<OnMount>[1],
        modelUri: string | null,
    ) => {
        disposeCompletions();
        completionDisposablesRef.current = [
            registerCompletions(monaco),
            registerAiModelCompletions(monaco, modelUri),
            registerChannelCompletions(monaco, modelUri),
            ...(flowId ? [registerDataTableCompletions(monaco, flowId, modelUri)] : []),
            registerVarsCompletions(monaco, modelUri),
            registerNodalAutocompleteCompletions(
                monaco,
                { ...autocompleteContext, outputData: autocompleteOutputData },
                modelUri,
            ),
            registerSnippetCompletions(monaco, modelUri),
            registerTabNameCompletions(monaco, modelUri, autocompleteContext.tabNames),
        ];
    }, [autocompleteContext, autocompleteOutputData, disposeCompletions, flowId]);

    const handleExpressionEditorMount = useCallback((
        currentEditor: editor.IStandaloneCodeEditor,
        monaco: Parameters<OnMount>[1],
    ) => {
        monacoRef.current = monaco;
        completionModelUriRef.current = currentEditor.getModel()?.uri.toString() ?? null;
        registerTemplateDecorations(currentEditor, monaco);
        registerReferenceLabelDecorations(currentEditor, monaco, { flowId });
        registerExpressionCompletions(monaco, completionModelUriRef.current);
    }, [flowId, registerExpressionCompletions]);

    const syncInlineEditorHeight = useCallback((
        currentEditor: editor.IStandaloneCodeEditor,
    ) => {
        setInlineEditorHeight(Math.min(
            EXPRESSION_MAX_HEIGHT,
            Math.max(EXPRESSION_MIN_HEIGHT, currentEditor.getContentHeight()),
        ));
    }, []);

    const handleInlineEditorMount: OnMount = useCallback((currentEditor, monaco) => {
        inlineEditorRef.current = currentEditor;
        handleExpressionEditorMount(currentEditor, monaco);
        const syncHeight = () => syncInlineEditorHeight(currentEditor);
        syncHeight();
        currentEditor.onDidContentSizeChange(syncHeight);
    }, [handleExpressionEditorMount, syncInlineEditorHeight]);

    const handleFixedTextareaEditorMount: OnMount = useCallback((currentEditor, monaco) => {
        inlineEditorRef.current = currentEditor;
        disposeCompletions();
        registerTemplateDecorations(currentEditor, monaco);
        const syncHeight = () => syncInlineEditorHeight(currentEditor);
        syncHeight();
        currentEditor.onDidContentSizeChange(syncHeight);
    }, [disposeCompletions, syncInlineEditorHeight]);

    const handleFullscreenEditorMount: OnMount = useCallback((currentEditor, monaco) => {
        fullscreenEditorRef.current = currentEditor;
        if (value.mode === 'expression') {
            handleExpressionEditorMount(currentEditor, monaco);
            return;
        }

        disposeCompletions();
        if (inputType === 'textarea') registerTemplateDecorations(currentEditor, monaco);
    }, [disposeCompletions, handleExpressionEditorMount, inputType, value.mode]);

    const updateValue = useCallback((
        mode: ScalarNodeParameterValue['mode'],
        nextValue: string,
        sourceEditor: editor.IStandaloneCodeEditor | null = null,
    ) => {
        isInternalChangeRef.current = Boolean(sourceEditor);
        lastChangedEditorRef.current = sourceEditor;
        onChange({ mode, value: nextValue });
    }, [onChange]);

    const updateExpression = useCallback((
        nextValue: string,
        sourceEditor: editor.IStandaloneCodeEditor | null = null,
    ) => updateValue('expression', nextValue, sourceEditor), [updateValue]);

    const updateFixedValue = useCallback((
        nextValue: string,
        sourceEditor: editor.IStandaloneCodeEditor | null = null,
    ) => updateValue('fixed', nextValue, sourceEditor), [updateValue]);

    const updateFullscreenValue = useCallback((nextValue: string) => {
        if (value.mode === 'expression') {
            updateExpression(nextValue, fullscreenEditorRef.current);
            return;
        }
        updateFixedValue(nextValue, fullscreenEditorRef.current);
    }, [updateExpression, updateFixedValue, value.mode]);

    const refreshInlineExpressionCompletions = useCallback(() => {
        if (inlineEditorRef.current && monacoRef.current) {
            handleExpressionEditorMount(inlineEditorRef.current, monacoRef.current);
        }
    }, [handleExpressionEditorMount]);

    useEffect(() => {
        const editors = [inlineEditorRef.current, fullscreenEditorRef.current]
            .filter(Boolean) as editor.IStandaloneCodeEditor[];

        if (isInternalChangeRef.current) {
            isInternalChangeRef.current = false;
            editors.forEach(item => {
                if (item === lastChangedEditorRef.current) return;
                if (item.getValue() !== value.value) item.setValue(value.value);
            });
            lastChangedEditorRef.current = null;
            return;
        }

        editors.forEach(item => {
            if (item.getValue() !== value.value) item.setValue(value.value);
        });
    }, [value.value]);

    useEffect(() => disposeCompletions, [disposeCompletions]);

    useEffect(() => {
        if (!isExpressionMode) {
            disposeCompletions();
            return;
        }

        if (monacoRef.current) {
            registerExpressionCompletions(monacoRef.current, completionModelUriRef.current);
        }
    }, [disposeCompletions, isExpressionMode, registerExpressionCompletions]);

    return {
        fullscreenEditorRef,
        handleFixedTextareaEditorMount,
        handleFullscreenEditorMount,
        handleInlineEditorMount,
        inlineEditorHeight,
        inlineEditorRef,
        refreshInlineExpressionCompletions,
        updateExpression,
        updateFixedValue,
        updateFullscreenValue,
    };
}
