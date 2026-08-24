import React, { useCallback, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { CodeEditor } from '@/Shared/CodeEditor/components/CodeEditor';
import { useCodeHelpPanel } from '@/Shared/CodeEditor/hooks/useCodeHelpPanel';
import { useSyncMonacoValue } from '@/Shared/CodeEditor/hooks/useSyncMonacoValue';
import Button from '@/Shared/UI/Button/Button';
import { useThemeMode } from '@/App/Hooks/useThemeMode';
import { useToast } from '@/App/Hooks/useToast';
import { useGrabber } from '@/Domains/Flow/Pages/FlowEditor/Grabber/GrabberContext';
import type { Flow } from '@/Domains/Flow/types';
import { normalizeNodalGraph } from '@/Domains/Flow/Pages/FlowEditor/nodalCompiler';
import NodalEditorPane from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodalEditorPane';
import { EvaluationModal } from '@/Domains/Flow/Pages/FlowEditor/Panes/CodeEditorPane/components/EvaluationModal/EvaluationModal';
import { ToolboxPanel } from '@/Domains/Flow/Pages/FlowEditor/Panes/CodeEditorPane/components/ToolboxPanel/ToolboxPanel';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { DEFAULT_CODE } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { CodeGizmo } from '@/Domains/Flow/Pages/FlowEditor/utils/codeGizmos';
import { useHelpEntryInsertion } from '@/Domains/Flow/Pages/FlowEditor/hooks/useHelpEntryInsertion';
import type { Workspace } from '@/Domains/Workspace/types';
import * as S from './DefaultFlowCodeSection.styled';

interface Props {
    workspace: Workspace;
    readOnly?: boolean;
}

export default function DefaultFlowCodeSection({ workspace, readOnly }: Props) {
    const { resolved: resolvedTheme } = useThemeMode();
    const { toast } = useToast();
    const { grabSelector } = useGrabber();
    const builtInGraph = useMemo(() => normalizeNodalGraph(null), []);
    const initialGraph = useMemo(
        () => normalizeNodalGraph(workspace.default_flow_nodal_graph),
        [workspace.default_flow_nodal_graph],
    );
    const [flowType, setFlowType] = useState<'code' | 'nodal'>(workspace.default_flow_type ?? 'nodal');
    const [code, setCode] = useState(workspace.default_flow_code ?? '');
    const [graph, setGraph] = useState<NodalGraph>(initialGraph);
    const [savedFlowType, setSavedFlowType] = useState<'code' | 'nodal'>(workspace.default_flow_type ?? 'nodal');
    const [savedCode, setSavedCode] = useState(workspace.default_flow_code ?? '');
    const [savedGraph, setSavedGraph] = useState<NodalGraph>(initialGraph);
    const [graphRevision, setGraphRevision] = useState(0);
    const [saving, setSaving] = useState(false);
    const typeDirty = flowType !== savedFlowType;
    const codeDirty = code !== savedCode;
    const graphDirty = JSON.stringify(graph) !== JSON.stringify(savedGraph);
    const dirty = typeDirty || (flowType === 'nodal' ? graphDirty : codeDirty);
    const usingBuiltInDefault = flowType === 'nodal'
        ? JSON.stringify(graph) === JSON.stringify(builtInGraph)
        : code === DEFAULT_CODE;
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const isInternalChange = useRef(false);
    useSyncMonacoValue(editorRef, code, { isInternalChange });
    const insertHelpEntry = useHelpEntryInsertion({ editorRef, readOnly });
    const help = useCodeHelpPanel({
        readOnly: Boolean(readOnly),
        insertEntry: insertHelpEntry,
    });
    const { focusEntry } = help;
    const editorFlow = useMemo(() => ({
        id: 'workspace-default-flow',
        name: 'Default Flow',
        default_inputs: null,
        latest_run: null,
        viewport_width: workspace.viewport_width,
        viewport_height: workspace.viewport_height,
        keyboard_speed: workspace.keyboard_speed,
        flow_type: 'nodal',
        nodal_graph: graph,
    } as Flow), [graph, workspace.keyboard_speed, workspace.viewport_height, workspace.viewport_width]);

    const editorOptions = useMemo(() => ({
        minimap: { enabled: false },
        fontSize: 12,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        glyphMargin: true,
        lineNumbers: 'on' as const,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: 'off' as const,
        padding: { top: 8 },
        readOnly: readOnly ?? false,
        wordBasedSuggestions: 'off' as const,
        suggest: {
            showFiles: false,
            showWords: false,
        },
    }), [readOnly]);

    const handleEditorChange = useCallback((value: string | undefined) => {
        isInternalChange.current = true;
        setCode(value ?? '');
    }, []);

    const handleEditorMount: OnMount = useCallback((mountedEditor) => {
        editorRef.current = mountedEditor;
    }, []);
    const handleCodeGizmoClick = useCallback(async (
        gizmo: CodeGizmo,
        forceOnboarding = false,
    ) => {
        if (gizmo.kind === 'helper') {
            focusEntry(gizmo.name);
            return;
        }

        const editorInstance = editorRef.current;
        const model = editorInstance?.getModel();
        if (
            readOnly
            || !editorInstance
            || !model
            || gizmo.argumentStart == null
            || gizmo.argumentEnd == null
        ) return;

        const versionId = model.getVersionId();
        const originalValue = model.getValue().slice(gizmo.argumentStart, gizmo.argumentEnd);
        try {
            const result = await grabSelector(gizmo.targetUrl, { forceOnboarding });
            if (
                editorInstance.getModel() !== model
                || model.getVersionId() !== versionId
                || model.getValue().slice(gizmo.argumentStart, gizmo.argumentEnd) !== originalValue
            ) {
                toast('The code changed while Grabber was active. The selector was not inserted.', 'error');
                return;
            }

            const start = model.getPositionAt(gizmo.argumentStart);
            const end = model.getPositionAt(gizmo.argumentEnd);
            editorInstance.pushUndoStop();
            editorInstance.executeEdits('puppetflow-grabber', [{
                range: {
                    startLineNumber: start.lineNumber,
                    startColumn: start.column,
                    endLineNumber: end.lineNumber,
                    endColumn: end.column,
                },
                text: JSON.stringify(result.selector),
                forceMoveMarkers: true,
            }]);
            editorInstance.pushUndoStop();
            editorInstance.focus();
        } catch {
            // GrabberContext owns cancellation and error feedback.
        }
    }, [focusEntry, grabSelector, readOnly, toast]);

    const handleReset = () => {
        if (flowType === 'nodal') {
            setGraph(normalizeNodalGraph(null));
            setGraphRevision(revision => revision + 1);
            return;
        }

        setCode(DEFAULT_CODE);
    };

    const handleSave = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (readOnly || saving) return;

        const payload: Record<string, FormDataConvertible> = {
            default_flow_type: flowType,
        };
        const flowTypeToSave = flowType;
        const codeToSave = code;
        let graphToSave: NodalGraph | null = null;
        if (flowType === 'nodal') {
            graphToSave = normalizeNodalGraph(graph);
            setGraph(graphToSave);
            payload.default_flow_nodal_graph = JSON.parse(JSON.stringify(graphToSave)) as FormDataConvertible;
        } else {
            payload.default_flow_code = codeToSave || null;
        }
        setSaving(true);
        router.put('/workspace', payload, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setSavedFlowType(flowTypeToSave);
                if (flowTypeToSave === 'nodal' && graphToSave) {
                    setSavedGraph(graphToSave);
                } else if (flowTypeToSave === 'code') {
                    setSavedCode(codeToSave);
                }
            },
            onFinish: () => setSaving(false),
        });
    };

    return (
        <S.Form onSubmit={handleSave}>
            <S.FieldHint>
                Choose the starting point used when creating a new flow in this workspace.
            </S.FieldHint>
            <S.ModeRow>
                <S.ModeToggle role="tablist" aria-label="Default flow editor">
                    <S.ModeOption
                        type="button"
                        role="tab"
                        aria-selected={flowType === 'nodal'}
                        $active={flowType === 'nodal'}
                        onClick={() => setFlowType('nodal')}
                    >
                        <Icon icon="lucide:workflow" width={14} />
                        Visual Builder
                    </S.ModeOption>
                    <S.ModeOption
                        type="button"
                        role="tab"
                        aria-selected={flowType === 'code'}
                        $active={flowType === 'code'}
                        onClick={() => setFlowType('code')}
                    >
                        <Icon icon="lucide:code-2" width={14} />
                        Raw Code
                    </S.ModeOption>
                </S.ModeToggle>
                {!readOnly && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={usingBuiltInDefault}
                        onClick={handleReset}
                    >
                        <Icon icon="lucide:rotate-ccw" width={13} />
                        Reset to default
                    </Button>
                )}
            </S.ModeRow>

            {flowType === 'nodal' ? (
                <S.VisualEditor>
                    <NodalEditorPane
                        flow={editorFlow}
                        saved={!dirty}
                        graph={graph}
                        graphRevision={graphRevision}
                        onGraphChange={setGraph}
                        onSave={handleSave}
                        saveButtonStyle="standard"
                        readOnly={readOnly}
                    />
                </S.VisualEditor>
            ) : (
                <>
                    <S.EditorLabel htmlFor="default_flow_code">Default flow code</S.EditorLabel>
                    <S.FieldHint>
                        Leave empty to use the built-in raw code template.
                    </S.FieldHint>
                    <S.CodeEditorShell>
                        <S.CodeEditor>
                            <CodeEditor
                                gizmos
                                onGizmoClick={handleCodeGizmoClick}
                                height="100%"
                                language="javascript"
                                theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                                value={code}
                                onChange={handleEditorChange}
                                options={editorOptions}
                                onMount={handleEditorMount}
                            />
                        </S.CodeEditor>
                        {help.showHelp && (
                            <ToolboxPanel
                                search={help.search}
                                activeCategoryKey={help.activeCategoryKey}
                                activeIndex={help.activeIndex}
                                entries={help.entries}
                                entryRefs={help.entryRefs}
                                onSearchChange={help.setSearch}
                                onSearchKeyDown={help.handleSearchKeyDown}
                                onCategoryChange={help.setActiveCategoryKey}
                                onActiveIndexChange={help.setActiveIndex}
                                onInsert={help.insert}
                                onEvaluate={help.evaluate}
                                onClose={help.closeHelp}
                            />
                        )}
                    </S.CodeEditorShell>
                    {help.evaluation && (
                        <EvaluationModal
                            evaluation={help.evaluation}
                            onClose={help.closeEvaluation}
                        />
                    )}
                </>
            )}
            {!readOnly && flowType === 'code' && (
                <S.FormActions>
                    <Button type="submit" size="sm" disabled={saving || !dirty}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </S.FormActions>
            )}
        </S.Form>
    );
}
