import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useSyncMonacoValue } from '@/Shared/CodeEditor/hooks/useSyncMonacoValue';
import JsonExpandable from '@/Shared/UI/JsonExpandable/JsonExpandable';
import { useThemeMode } from '@/App/Hooks/useThemeMode';
import { invalidateVariableCache, registerJsonVariableCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/variableSuggestions';
import { registerJsonReferenceNamespaceCompletions, registerJsonResourceReferenceCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/resourceReferenceSuggestions';
import { registerReferenceLabelDecorations } from '@/Domains/Flow/Pages/FlowEditor/utils/referenceLabelDecorations';
import * as S from './styled';

interface JsonEditorProps {
    value: string;
    title: string;
    readOnly: boolean;
    height: number;
    flowId?: Id;
    openRef: MutableRefObject<(() => void) | null>;
    onChange: (value: string | undefined) => void;
}

export default function JsonEditor({
    value,
    title,
    readOnly,
    height,
    flowId,
    openRef,
    onChange,
}: JsonEditorProps) {
    const { resolved: theme } = useThemeMode();
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const completionDisposableRef = useRef<{ dispose: () => void } | null>(null);
    const isSyncingRef = useRef(false);
    useSyncMonacoValue(editorRef, value, { isProgrammaticChange: isSyncingRef });

    useEffect(() => () => completionDisposableRef.current?.dispose(), []);

    const handleMount: OnMount = (currentEditor, monaco) => {
        editorRef.current = currentEditor;
        invalidateVariableCache();
        completionDisposableRef.current?.dispose();
        const disposables = [
            registerJsonReferenceNamespaceCompletions(
                monaco,
                flowId ? ['vars', 'channels', 'mailboxWatchers', 'aiModels', 'dataTables'] : ['vars'],
            ),
            registerJsonVariableCompletions(monaco),
            ...(flowId ? [registerJsonResourceReferenceCompletions(monaco, flowId)] : []),
            registerReferenceLabelDecorations(currentEditor, monaco, { flowId }),
        ];
        completionDisposableRef.current = {
            dispose: () => disposables.forEach(disposable => disposable.dispose()),
        };
    };

    const handleChange = useCallback((nextValue: string | undefined) => {
        if (!isSyncingRef.current) onChange(nextValue || '{}');
    }, [onChange]);

    return (
        <JsonExpandable
            value={value}
            onChange={nextValue => onChange(nextValue)}
            title={title}
            readOnly={readOnly}
            hideDefaultTrigger
            openRef={openRef}
        >
            <S.EditorWrapper style={{ height }}>
                <Editor
                    height="100%"
                    language="json"
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    defaultValue={value}
                    onChange={handleChange}
                    onMount={handleMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        lineNumbers: 'off',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'off',
                        padding: { top: 8 },
                        fixedOverflowWidgets: true,
                        quickSuggestions: { strings: true, other: true, comments: false },
                        wordBasedSuggestions: 'off',
                        suggest: {
                            showFiles: false,
                            showWords: false,
                        },
                        readOnly,
                    }}
                />
            </S.EditorWrapper>
        </JsonExpandable>
    );
}
