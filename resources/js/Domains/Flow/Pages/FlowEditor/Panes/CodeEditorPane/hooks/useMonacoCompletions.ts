import { useCallback, useEffect, useRef } from 'react';
import type { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { registerAiModelCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/aiModelSuggestions';
import { registerChannelCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/channelSuggestions';
import { registerDataTableCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/dataTableSuggestions';
import { registerCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/monacoBase';
import { registerInputCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/inputCompletions';
import { registerMailboxWatcherCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/mailboxWatcherSuggestions';
import { registerReferenceLabelDecorations } from '@/Domains/Flow/Pages/FlowEditor/utils/referenceLabelDecorations';
import { registerSnippetCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/snippetSuggestions';
import { registerVarsCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/variableSuggestions';
import { registerTabNameCompletions } from '@/Domains/Flow/Pages/FlowEditor/utils/tabNameSuggestions';

type Monaco = Parameters<OnMount>[1];
type Disposable = { dispose: () => void };

interface UseMonacoCompletionsOptions {
    flowId: Id;
    defaultInputs: Record<string, unknown> | null;
    onRun?: () => void;
}

// Registers Puppetflow completions and editor shortcuts for the code workspace.
export function useMonacoCompletions({
    flowId,
    defaultInputs,
    onRun,
}: UseMonacoCompletionsOptions) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const onRunRef = useRef(onRun);
    const disposablesRef = useRef<{
        base?: Disposable;
        aiModel?: Disposable;
        channel?: Disposable;
        dataTable?: Disposable;
        vars?: Disposable;
        watcher?: Disposable;
        input?: Disposable;
        snippet?: Disposable;
        tabName?: Disposable;
        referenceLabels?: Disposable;
    }>({});

    onRunRef.current = onRun;

    const registerBaseCompletions = useCallback((monaco: Monaco) => {
        disposablesRef.current.base ??= registerCompletions(monaco);
    }, []);

    const handleEditorBeforeMount = useCallback((monaco: Monaco) => {
        registerBaseCompletions(monaco);
    }, [registerBaseCompletions]);

    const handleEditorMount: OnMount = useCallback((editorInstance, monaco) => {
        editorRef.current = editorInstance;
        monacoRef.current = monaco;

        const modelUri = editorInstance.getModel()?.uri.toString() ?? null;
        registerBaseCompletions(monaco);
        disposablesRef.current.aiModel?.dispose();
        disposablesRef.current.channel?.dispose();
        disposablesRef.current.dataTable?.dispose();
        disposablesRef.current.vars?.dispose();
        disposablesRef.current.watcher?.dispose();
        disposablesRef.current.input?.dispose();
        disposablesRef.current.snippet?.dispose();
        disposablesRef.current.tabName?.dispose();
        disposablesRef.current.referenceLabels?.dispose();
        disposablesRef.current.aiModel = registerAiModelCompletions(monaco, modelUri);
        disposablesRef.current.channel = registerChannelCompletions(monaco, modelUri);
        disposablesRef.current.dataTable = registerDataTableCompletions(monaco, flowId, modelUri);
        disposablesRef.current.vars = registerVarsCompletions(monaco, modelUri);
        disposablesRef.current.watcher = registerMailboxWatcherCompletions(monaco, flowId, modelUri);
        disposablesRef.current.input = registerInputCompletions(monaco, defaultInputs, modelUri);
        disposablesRef.current.snippet = registerSnippetCompletions(monaco, modelUri);
        disposablesRef.current.tabName = registerTabNameCompletions(monaco, modelUri);
        disposablesRef.current.referenceLabels = registerReferenceLabelDecorations(editorInstance, monaco, { flowId });

        editorInstance.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            () => {
                const textarea = editorInstance.getDomNode()?.querySelector('textarea');
                if (textarea) textarea.blur();
                onRunRef.current?.();
            },
        );
    }, [defaultInputs, flowId, registerBaseCompletions]);

    useEffect(() => {
        const monaco = monacoRef.current;
        const modelUri = editorRef.current?.getModel()?.uri.toString() ?? null;
        if (!monaco || !disposablesRef.current.input) return;

        disposablesRef.current.input.dispose();
        disposablesRef.current.input = registerInputCompletions(monaco, defaultInputs, modelUri);
    }, [defaultInputs]);

    useEffect(() => {
        const monaco = monacoRef.current;
        const modelUri = editorRef.current?.getModel()?.uri.toString() ?? null;
        if (!monaco || !disposablesRef.current.watcher) return;

        disposablesRef.current.watcher.dispose();
        disposablesRef.current.watcher = registerMailboxWatcherCompletions(monaco, flowId, modelUri);
    }, [flowId]);

    useEffect(() => () => {
        Object.values(disposablesRef.current).forEach(disposable => disposable?.dispose());
        disposablesRef.current = {};
        editorRef.current = null;
        monacoRef.current = null;
    }, []);

    return {
        editorRef,
        handleEditorBeforeMount,
        handleEditorMount,
    };
}
