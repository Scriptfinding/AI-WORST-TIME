import { useCallback, useEffect, useMemo, useState } from 'react';
import Editor, { type EditorProps, type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import styled, { css } from 'styled-components';
import { useCodeGizmos } from '@/Domains/Flow/Pages/FlowEditor/hooks/useCodeGizmos';
import type { CodeGizmo } from '@/Domains/Flow/Pages/FlowEditor/utils/codeGizmos';
import { useMonacoDecorations } from '@/Shared/CodeEditor/hooks/useMonacoDecorations';
import { codeGizmoStyles } from '@/Shared/CodeEditor/shared/code-gizmos.styled';

interface CodeEditorProps extends EditorProps {
    gizmos?: boolean;
    selectorGizmos?: boolean;
    onGizmoClick?: (gizmo: CodeGizmo, forceOnboarding?: boolean) => void;
}

const EditorScope = styled.div<{ $gizmos: boolean; $clickableGizmos: boolean }>`
    display: contents;
    ${({ $gizmos }) => $gizmos && codeGizmoStyles}
    ${({ $clickableGizmos }) => $clickableGizmos && css`
        .nop-code-gizmo,
        .nop-code-gizmo-favicon,
        .nop-code-gizmo-selector {
            cursor: pointer;
        }
    `}
`;

const getLineNumberMinChars = (lineCount: number, configuredMinimum = 5) => (
    Math.max(configuredMinimum, String(Math.max(1, lineCount)).length + 1)
);

export function CodeEditor({
    gizmos = false,
    selectorGizmos = true,
    onGizmoClick,
    onMount,
    value,
    defaultValue,
    options,
    ...editorProps
}: CodeEditorProps) {
    const [editorInstance, setEditorInstance] =
        useState<editor.IStandaloneCodeEditor | null>(null);
    const [monacoInstance, setMonacoInstance] =
        useState<Parameters<OnMount>[1] | null>(null);
    const code = value ?? defaultValue ?? '';
    const configuredLineNumberMinChars = options?.lineNumbersMinChars ?? 5;
    const lineNumbersEnabled = options?.lineNumbers !== 'off';
    const editorOptions = useMemo(() => {
        if (!lineNumbersEnabled) return options;

        const lineCount = code.split('\n').length;
        return {
            ...options,
            lineNumbersMinChars: getLineNumberMinChars(
                lineCount,
                configuredLineNumberMinChars,
            ),
        };
    }, [code, configuredLineNumberMinChars, lineNumbersEnabled, options]);
    const gizmoDecorations = useCodeGizmos({
        code: gizmos ? code : '',
        editorInstance,
        monacoInstance,
        selectorGizmos,
        onGizmoClick,
    });

    useMonacoDecorations({
        editor: editorInstance,
        model: editorInstance?.getModel() ?? null,
        decorations: gizmoDecorations,
    });

    useEffect(() => {
        if (!editorInstance || !lineNumbersEnabled) return;

        let currentMinChars = 0;
        const syncLineNumberWidth = () => {
            const nextMinChars = getLineNumberMinChars(
                editorInstance.getModel()?.getLineCount() ?? 1,
                configuredLineNumberMinChars,
            );
            if (nextMinChars === currentMinChars) return;

            currentMinChars = nextMinChars;
            editorInstance.updateOptions({ lineNumbersMinChars: nextMinChars });
        };
        syncLineNumberWidth();
        const disposable = editorInstance.onDidChangeModelContent(syncLineNumberWidth);
        return () => disposable.dispose();
    }, [configuredLineNumberMinChars, editorInstance, lineNumbersEnabled]);

    const handleMount: OnMount = useCallback((mountedEditor, monaco) => {
        setEditorInstance(mountedEditor);
        setMonacoInstance(monaco);
        onMount?.(mountedEditor, monaco);
    }, [onMount]);

    return (
        <EditorScope $gizmos={gizmos} $clickableGizmos={Boolean(onGizmoClick)}>
            <Editor
                {...editorProps}
                value={value}
                defaultValue={defaultValue}
                options={editorOptions}
                onMount={handleMount}
            />
        </EditorScope>
    );
}
