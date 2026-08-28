import { useCallback, useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useSyncMonacoValue } from '@/Shared/CodeEditor/hooks/useSyncMonacoValue';
import { useThemeMode } from '@/App/Hooks/useThemeMode';
import { registerAiModelCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/aiModelSuggestions';
import { registerChannelCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/channelSuggestions';
import { registerDataTableCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/dataTableSuggestions';
import { registerCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/monacoBase';
import { registerNodalAutocompleteCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/inputCompletions';
import { registerReferenceLabelDecorations } from '@/Domains/Flow/Pages/FlowEditor/utils/referenceLabelDecorations';
import { registerSnippetCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/snippetSuggestions';
import { registerVarsCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/variableSuggestions';
import { registerTabNameCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/tabNameSuggestions';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import * as S from './styled';

const CODE_NODE_EDITOR_OPTIONS = {
    minimap: { enabled: false },
    fontSize: 12,
    lineHeight: 19,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on' as const,
    padding: { top: 10, bottom: 10 },
    fixedOverflowWidgets: true,
    contextmenu: false,
    bracketPairColorization: { enabled: true },
    wordBasedSuggestions: 'off' as const,
    suggest: {
        showFiles: false,
        showWords: false,
    },
};

interface CodeNodeEditorProps {
    value: string;
    outputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    flowId?: Id;
    readOnly?: boolean;
    onChange: (value: string) => void;
}

export default function CodeNodeEditor({
    value,
    outputData,
    autocompleteContext,
    flowId,
    readOnly,
    onChange,
}: CodeNodeEditorProps) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
    const completionDisposablesRef = useRef<{ dispose: () => void }[]>([]);
    const { resolved: theme } = useThemeMode();
    useSyncMonacoValue(editorRef, value);

    useEffect(() => () => {
        completionDisposablesRef.current.forEach(item => item.dispose());
        completionDisposablesRef.current = [];
    }, []);

    const registerEditorCompletions = useCallback((monaco: Parameters<OnMount>[1]) => {
        const modelUri = editorRef.current?.getModel()?.uri.toString() ?? null;
        completionDisposablesRef.current.forEach(item => item.dispose());
        completionDisposablesRef.current = [
            registerCompletions(monaco),
            registerVarsCompletions(monaco, modelUri),
            registerNodalAutocompleteCompletions(monaco, { ...autocompleteContext, outputData }, modelUri),
            registerAiModelCompletions(monaco, modelUri),
            registerChannelCompletions(monaco, modelUri),
            ...(flowId ? [registerDataTableCompletions(monaco, flowId, modelUri)] : []),
            registerSnippetCompletions(monaco, modelUri),
            registerTabNameCompletions(monaco, modelUri, autocompleteContext.tabNames),
        ];
    }, [autocompleteContext, flowId, outputData]);

    useEffect(() => {
        if (!monacoRef.current) return;
        registerEditorCompletions(monacoRef.current);
    }, [registerEditorCompletions]);

    const handleMount: OnMount = (editorInstance, monaco) => {
        editorRef.current = editorInstance;
        monacoRef.current = monaco;
        registerEditorCompletions(monaco);
        registerReferenceLabelDecorations(editorInstance, monaco, { flowId });
    };

    return (
        <S.CodeNodeField>
            <S.CodeNodeEditor>
                <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    value={value}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    options={{ ...CODE_NODE_EDITOR_OPTIONS, readOnly }}
                    onMount={handleMount}
                    onChange={nextValue => onChange(nextValue ?? '')}
                />
            </S.CodeNodeEditor>
            <S.ExpressionHint>
                This code is inserted directly in the generated run function. You can use $page, $input, $nodes, $run, $output, $context and $vars(…) (autocompleted).
            </S.ExpressionHint>
        </S.CodeNodeField>
    );
}
