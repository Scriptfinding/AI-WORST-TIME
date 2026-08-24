import { useCallback, useMemo, useState } from 'react';
import type { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useMonacoDecorations } from '@/Shared/CodeEditor/hooks/useMonacoDecorations';
import { getDisplayCodeSnapshotWithLineMap } from '@/Domains/Flow/Pages/FlowEditor/Modals/RunDetailModal/runProgress';
import type { CodeSnapshotEditorProps } from './types';
import { getExpandedStatementLines } from './utils';

type MonacoInstance = Parameters<OnMount>[1];

const revealOptions = { timing: 'afterDecorations' as const };

const toDecorations = (
    monaco: MonacoInstance,
    lines: number[],
    state: 'passed' | 'active' | 'error',
): editor.IModelDeltaDecoration[] => lines.map(line => ({
    range: new monaco.Range(line, 1, line, 1),
    options: {
        isWholeLine: true,
        className: `nop-run-line-${state}`,
        linesDecorationsClassName: `nop-run-line-${state}-gutter`,
    },
}));

// Configures the run snapshot editor and decorates active, passed, and failed lines.
export function useCodeSnapshotEditor({
    code,
    activeLine,
    passedLines,
    errorLine = null,
}: Pick<
    CodeSnapshotEditorProps,
    'code' | 'activeLine' | 'passedLines' | 'errorLine'
>) {
    const [editorInstance, setEditorInstance] =
        useState<editor.IStandaloneCodeEditor | null>(null);
    const [monacoInstance, setMonacoInstance] = useState<MonacoInstance | null>(null);
    const displaySnapshot = useMemo(
        () => getDisplayCodeSnapshotWithLineMap(code),
        [code],
    );
    const displayActiveLine = activeLine != null
        ? displaySnapshot.lineMap.get(activeLine) ?? null
        : null;
    const displayErrorLine = errorLine != null
        ? displaySnapshot.lineMap.get(errorLine) ?? null
        : null;
    const activeLines = useMemo(
        () => displayActiveLine != null
            ? getExpandedStatementLines(displaySnapshot.code, [displayActiveLine])
            : [],
        [displayActiveLine, displaySnapshot.code],
    );
    const errorLines = useMemo(
        () => displayErrorLine != null
            ? getExpandedStatementLines(displaySnapshot.code, [displayErrorLine])
            : [],
        [displayErrorLine, displaySnapshot.code],
    );
    const completedLines = useMemo(
        () => getExpandedStatementLines(
            displaySnapshot.code,
            passedLines
                .map(line => displaySnapshot.lineMap.get(line))
                .filter((line): line is number =>
                    line != null && line !== displayErrorLine),
        ),
        [
            displayErrorLine,
            displaySnapshot.code,
            displaySnapshot.lineMap,
            passedLines,
        ],
    );
    const handleMount: OnMount = useCallback((mountedEditor, monaco) => {
        setEditorInstance(mountedEditor);
        setMonacoInstance(monaco);
    }, []);

    const decorations = useMemo(() => {
        if (!monacoInstance) return [];

        return [
            ...toDecorations(monacoInstance, completedLines, 'passed'),
            ...toDecorations(monacoInstance, activeLines, 'active'),
            ...toDecorations(monacoInstance, errorLines, 'error'),
        ];
    }, [
        activeLines,
        completedLines,
        errorLines,
        monacoInstance,
    ]);

    useMonacoDecorations({
        editor: editorInstance,
        model: editorInstance?.getModel() ?? null,
        decorations,
        line: displayErrorLine ?? displayActiveLine,
        reveal: revealOptions,
    });

    return {
        displayCode: displaySnapshot.code,
        handleMount,
    };
}
