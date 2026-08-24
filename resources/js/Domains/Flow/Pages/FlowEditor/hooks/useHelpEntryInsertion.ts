import { useCallback } from 'react';
import type { editor } from 'monaco-editor';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import { buildHelpInsertText } from '@/Domains/Flow/Pages/FlowEditor/utils/helpToolbox';

interface UseHelpEntryInsertionOptions {
    editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
    readOnly?: boolean;
}

// Inserts a help entry snippet at the current selection and places the caret
// inside the first pair of parentheses.
export function useHelpEntryInsertion({ editorRef, readOnly }: UseHelpEntryInsertionOptions) {
    return useCallback((entry: HelpEntryDef): boolean => {
        if (readOnly) return false;

        const editorInstance = editorRef.current;
        const selection = editorInstance?.getSelection();
        if (!editorInstance || !selection) return false;

        const text = buildHelpInsertText(entry);
        const openParenIndex = text.indexOf('(');
        editorInstance.executeEdits('help-entry-insert', [{
            range: selection,
            text,
            forceMoveMarkers: true,
        }]);

        const position = editorInstance.getPosition();
        if (position && openParenIndex !== -1) {
            const charsAfterCursor = text.length - openParenIndex - 1;
            editorInstance.setPosition({
                lineNumber: position.lineNumber,
                column: Math.max(1, position.column - charsAfterCursor),
            });
        }
        editorInstance.focus();
        return true;
    }, [editorRef, readOnly]);
}
