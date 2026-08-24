import { useEffect, useRef } from 'react';
import type { editor } from 'monaco-editor';

interface MonacoRevealOptions {
    timing: 'beforeDecorations' | 'afterDecorations';
}

interface UseMonacoDecorationsOptions {
    editor: editor.IStandaloneCodeEditor | null;
    model: editor.ITextModel | null;
    decorations: editor.IModelDeltaDecoration[];
    line?: number | null;
    reveal?: MonacoRevealOptions;
}

// Applies validated decorations to a Monaco model and optionally reveals their target line.
export function useMonacoDecorations({
    editor: editorInstance,
    model,
    decorations,
    line = null,
    reveal,
}: UseMonacoDecorationsOptions) {
    const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);

    useEffect(() => {
        if (!editorInstance || !model) return;

        const collection = decorationsRef.current
            ?? editorInstance.createDecorationsCollection();
        decorationsRef.current = collection;

        const maxLine = model.getLineCount();
        const validDecorations = decorations.filter(decoration =>
            decoration.range.startLineNumber >= 1
            && decoration.range.endLineNumber <= maxLine);
        const revealLine = () => {
            if (line != null && line >= 1 && line <= maxLine) {
                editorInstance.revealLineInCenterIfOutsideViewport(line);
            }
        };

        if (reveal?.timing === 'beforeDecorations') revealLine();
        collection.set(validDecorations);
        if (reveal?.timing === 'afterDecorations') revealLine();
    }, [decorations, editorInstance, line, model, reveal]);

    useEffect(() => () => {
        decorationsRef.current?.clear();
        decorationsRef.current = null;
    }, []);
}
