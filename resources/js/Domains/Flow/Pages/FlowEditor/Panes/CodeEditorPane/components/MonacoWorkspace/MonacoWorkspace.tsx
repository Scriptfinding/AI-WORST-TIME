import {
    forwardRef,
    useCallback,
    useImperativeHandle,
    useMemo,
    useRef,
} from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { OnMount } from '@monaco-editor/react';
import { CodeEditor } from '@/Shared/CodeEditor/components/CodeEditor';
import { useSyncMonacoValue } from '@/Shared/CodeEditor/hooks/useSyncMonacoValue';
import { FloatingHelpButton } from '@/Shared/CodeEditor/shared/editor-layout.styled';
import { useThemeMode } from '@/App/Hooks/useThemeMode';
import { useToast } from '@/App/Hooks/useToast';
import { useGrabber } from '@/Domains/Flow/Pages/FlowEditor/Grabber/GrabberContext';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { CodeGizmo } from '@/Domains/Flow/Pages/FlowEditor/utils/codeGizmos';
import { getMissingAwaitCalls } from '@/Domains/Flow/Pages/FlowEditor/utils/missingAwaits';
import { useHelpEntryInsertion } from '@/Domains/Flow/Pages/FlowEditor/hooks/useHelpEntryInsertion';
import { useMonacoCompletions } from '@/Domains/Flow/Pages/FlowEditor/Panes/CodeEditorPane/hooks/useMonacoCompletions';
import { useUndefinedSymbolDiagnostics } from '@/Domains/Flow/Pages/FlowEditor/Panes/CodeEditorPane/hooks/useUndefinedSymbolDiagnostics';
import * as S from './styled';

interface MonacoWorkspaceProps {
    code: string;
    defaultInputs: Record<string, unknown> | null;
    flowId: Id;
    readOnly: boolean;
    onCodeChange: (value: string | undefined) => void;
    onGizmoClick: (name: string) => void;
    onOpenHelp: () => void;
    onRun?: () => void;
}

export interface MonacoWorkspaceHandle {
    insertHelpEntry: (entry: HelpEntryDef) => boolean;
    fixMissingAwaits: () => number;
}

export const MonacoWorkspace = forwardRef<MonacoWorkspaceHandle, MonacoWorkspaceProps>(
    function MonacoWorkspace({
        code,
        defaultInputs,
        flowId,
        readOnly,
        onCodeChange,
        onGizmoClick,
        onOpenHelp,
        onRun,
    }, ref) {
        const isInternalChange = useRef(false);
        const { resolved: resolvedTheme } = useThemeMode();
        const { toast } = useToast();
        const { grabSelector } = useGrabber();
        const {
            editorRef,
            handleEditorBeforeMount,
            handleEditorMount: handleCompletionsMount,
        } = useMonacoCompletions({
            flowId,
            defaultInputs,
            onRun,
        });
        const handleDiagnosticsMount = useUndefinedSymbolDiagnostics();
        const handleEditorMount = useCallback<OnMount>(
            (editor, monaco) => {
                handleCompletionsMount(editor, monaco);
                handleDiagnosticsMount(editor, monaco);
            },
            [handleCompletionsMount, handleDiagnosticsMount],
        );
        useSyncMonacoValue(editorRef, code, { isInternalChange });

        const editorOptions = useMemo(() => ({
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            glyphMargin: true,
            lineNumbers: 'on' as const,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fixedOverflowWidgets: true,
            tabSize: 4,
            wordWrap: 'off' as const,
            padding: { top: 12 },
            readOnly,
            wordBasedSuggestions: 'off' as const,
            suggest: {
                showFiles: false,
                showWords: false,
            },
        }), [readOnly]);

        const handleEditorChange = useCallback((value: string | undefined) => {
            isInternalChange.current = true;
            onCodeChange(value);
        }, [onCodeChange]);
        const insertHelpEntry = useHelpEntryInsertion({ editorRef, readOnly });
        const handleCodeGizmoClick = useCallback(async (
            gizmo: CodeGizmo,
            forceOnboarding = false,
        ) => {
            if (gizmo.kind === 'helper') {
                onGizmoClick(gizmo.name);
                return;
            }
            const editor = editorRef.current;
            const model = editor?.getModel();
            if (
                readOnly
                || !editor
                || !model
                || gizmo.argumentStart == null
                || gizmo.argumentEnd == null
            ) return;

            const versionId = model.getVersionId();
            const originalValue = model.getValue().slice(gizmo.argumentStart, gizmo.argumentEnd);
            try {
                const result = await grabSelector(gizmo.targetUrl, { forceOnboarding });
                if (
                    editor.getModel() !== model
                    || model.getVersionId() !== versionId
                    || model.getValue().slice(gizmo.argumentStart, gizmo.argumentEnd) !== originalValue
                ) {
                    toast('The code changed while Grabber was active. The selector was not inserted.', 'error');
                    return;
                }

                const start = model.getPositionAt(gizmo.argumentStart);
                const end = model.getPositionAt(gizmo.argumentEnd);
                const range = {
                    startLineNumber: start.lineNumber,
                    startColumn: start.column,
                    endLineNumber: end.lineNumber,
                    endColumn: end.column,
                };
                editor.pushUndoStop();
                editor.executeEdits('puppetflow-grabber', [{
                    range,
                    text: JSON.stringify(result.selector),
                    forceMoveMarkers: true,
                }]);
                editor.pushUndoStop();
                editor.focus();
            } catch {
                // GrabberContext owns cancellation and error feedback.
            }
        }, [editorRef, grabSelector, onGizmoClick, readOnly, toast]);
        const fixMissingAwaits = useCallback(() => {
            const editor = editorRef.current;
            const model = editor?.getModel();
            if (readOnly || !editor || !model) return 0;

            const calls = getMissingAwaitCalls(model.getValue());
            if (calls.length === 0) return 0;

            editor.pushUndoStop();
            editor.executeEdits('puppetflow-fix-missing-awaits', calls.map(call => {
                const position = model.getPositionAt(call.start);
                return {
                    range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column,
                    },
                    text: 'await ',
                    forceMoveMarkers: true,
                };
            }));
            editor.pushUndoStop();
            editor.focus();
            return calls.length;
        }, [editorRef, readOnly]);
        useImperativeHandle(
            ref,
            () => ({ insertHelpEntry, fixMissingAwaits }),
            [fixMissingAwaits, insertHelpEntry],
        );

        return (
            <S.CodePane $readOnly={readOnly}>
                <CodeEditor
                    gizmos
                    onGizmoClick={handleCodeGizmoClick}
                    height="100%"
                    language="javascript"
                    theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                    defaultValue={code}
                    onChange={handleEditorChange}
                    options={editorOptions}
                    beforeMount={handleEditorBeforeMount}
                    onMount={handleEditorMount}
                />
                <FloatingHelpButton
                    type="button"
                    data-code-help-trigger
                    onClick={onOpenHelp}
                    title="Open function help"
                >
                    <Icon icon="lucide:life-buoy" />
                </FloatingHelpButton>
            </S.CodePane>
        );
    },
);
