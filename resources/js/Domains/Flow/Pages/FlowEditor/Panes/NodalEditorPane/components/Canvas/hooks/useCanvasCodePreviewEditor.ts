import { useCallback, useMemo, useState } from 'react';
import type { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useMonacoDecorations } from '@/Shared/CodeEditor/hooks/useMonacoDecorations';
import { getDisplayCodeSnapshotWithLineMap } from '@/Domains/Flow/Pages/FlowEditor/Modals/RunDetailModal/runProgress';
import { getExpandedStatementLines, toDecorations } from '../utils';

type MonacoInstance = Parameters<OnMount>[1];

const revealOptions = { timing: 'beforeDecorations' as const };

interface UseCanvasCodePreviewEditorOptions {
    generatedCode: string;
    codeSnapshot?: string | null;
    activeLine?: number | null;
    passedLines?: Set<number> | number[];
    errorLine?: number | null;
}

// Prepares the read-only canvas code preview and its execution-line decorations.
export const useCanvasCodePreviewEditor = ({
    generatedCode,
    codeSnapshot,
    activeLine = null,
    passedLines = [],
    errorLine = null,
}: UseCanvasCodePreviewEditorOptions) => {
    const [editorInstance, setEditorInstance] =
        useState<editor.IStandaloneCodeEditor | null>(null);
    const [monacoInstance, setMonacoInstance] = useState<MonacoInstance | null>(null);
    const displaySnapshot = useMemo(() => {
        if (codeSnapshot) return getDisplayCodeSnapshotWithLineMap(codeSnapshot);

        return {
            code: generatedCode,
            lineMap: new Map(generatedCode.split('\n').map((_, index) => [index + 1, index + 1])),
        };
    }, [codeSnapshot, generatedCode]);
    const passedLineValues = useMemo(() => Array.from(passedLines), [passedLines]);
    const displayActiveLine = activeLine != null ? displaySnapshot.lineMap.get(activeLine) ?? null : null;
    const displayErrorLine = errorLine != null ? displaySnapshot.lineMap.get(errorLine) ?? null : null;
    const displayActiveLines = useMemo(
        () => displayActiveLine != null ? getExpandedStatementLines(displaySnapshot.code, [displayActiveLine]) : [],
        [displayActiveLine, displaySnapshot.code],
    );
    const displayErrorLines = useMemo(
        () => displayErrorLine != null ? getExpandedStatementLines(displaySnapshot.code, [displayErrorLine]) : [],
        [displayErrorLine, displaySnapshot.code],
    );
    const displayPassedLines = useMemo(
        () => getExpandedStatementLines(displaySnapshot.code, passedLineValues
            .map(line => displaySnapshot.lineMap.get(line))
            .filter((line): line is number => typeof line === 'number' && line !== displayErrorLine)),
        [displayErrorLine, displaySnapshot.code, displaySnapshot.lineMap, passedLineValues],
    );
    const handleCodeMount: OnMount = useCallback((mountedEditor, monaco) => {
        setEditorInstance(mountedEditor);
        setMonacoInstance(monaco);
    }, []);
    const decorations = useMemo(() => {
        if (!monacoInstance) return [];

        return [
            ...toDecorations(monacoInstance, displayPassedLines, 'passed'),
            ...toDecorations(monacoInstance, displayActiveLines, 'active'),
            ...toDecorations(monacoInstance, displayErrorLines, 'error'),
        ];
    }, [displayActiveLines, displayErrorLines, displayPassedLines, monacoInstance]);

    useMonacoDecorations({
        editor: editorInstance,
        model: editorInstance?.getModel() ?? null,
        decorations,
        line: displayActiveLine ?? displayErrorLine,
        reveal: revealOptions,
    });

    return {
        displayCode: displaySnapshot.code,
        handleCodeMount,
    };
};
