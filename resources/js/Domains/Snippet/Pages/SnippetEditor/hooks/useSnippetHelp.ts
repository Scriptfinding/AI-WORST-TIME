import { useCallback } from 'react';
import type { OnMount } from '@monaco-editor/react';
import { useCodeHelpPanel } from '@/Shared/CodeEditor/hooks/useCodeHelpPanel';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import { buildHelpInsertText } from '@/Domains/Flow/Pages/FlowEditor/utils/helpToolbox';

type EditorInstance = Parameters<OnMount>[0];

// Inserts help entries into Monaco and positions the cursor inside call arguments.
export function useSnippetHelp(
    editorRef: React.MutableRefObject<EditorInstance | null>,
    readOnly: boolean,
) {
    const insertEntry = useCallback((entry: HelpEntryDef) => {
        const editor = editorRef.current;
        const selection = editor?.getSelection();
        if (!editor || !selection) return false;

        const text = buildHelpInsertText(entry);
        const openParenIndex = text.indexOf('(');
        editor.executeEdits('help-entry-insert', [{
            range: selection,
            text,
            forceMoveMarkers: true,
        }]);

        const position = editor.getPosition();
        if (position && openParenIndex !== -1) {
            const charsAfterCursor = text.length - openParenIndex - 1;
            editor.setPosition({
                lineNumber: position.lineNumber,
                column: Math.max(1, position.column - charsAfterCursor),
            });
        }
        editor.focus();
        return true;
    }, [editorRef]);

    return useCodeHelpPanel({ readOnly, insertEntry });
}
