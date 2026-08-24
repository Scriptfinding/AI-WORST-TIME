import { useCallback, useEffect, useRef } from 'react';
import type { OnMount } from '@monaco-editor/react';
import { registerCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/monacoBase';
import { registerReferenceLabelDecorations } from '@/Domains/Flow/Pages/FlowEditor/utils/referenceLabelDecorations';
import { registerSnippetCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/snippetSuggestions';

type EditorInstance = Parameters<OnMount>[0];
type Disposable = { dispose: () => void };

// Registers snippet-aware Monaco completions and disposes them with the editor.
export function useMonacoCompletions(
    editorRef: React.MutableRefObject<EditorInstance | null>,
) {
    const disposablesRef = useRef<{
        base?: Disposable;
        snippets?: Disposable;
        referenceLabels?: Disposable;
    }>({});

    const handleEditorMount: OnMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        disposablesRef.current.base ??= registerCompletions(monaco);
        disposablesRef.current.snippets ??= registerSnippetCompletions(
            monaco,
            editor.getModel()?.uri.toString() ?? null,
        );
        disposablesRef.current.referenceLabels?.dispose();
        disposablesRef.current.referenceLabels = registerReferenceLabelDecorations(editor, monaco);
    }, [editorRef]);

    useEffect(() => () => {
        Object.values(disposablesRef.current).forEach(disposable => disposable?.dispose());
        disposablesRef.current = {};
    }, []);

    return handleEditorMount;
}
