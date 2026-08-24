import { useCallback, useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { useTheme } from 'styled-components';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useDocumentTitle } from '@/App/Hooks/useDocumentTitle';
import { useToast } from '@/App/Hooks/useToast';
import { useWaitingHumanSet } from '@/Domains/Flow/Hooks/useWaitingHuman';
import type { Workspace } from '@/Domains/Workspace/types';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import { compileNodalGraphToCode, normalizeNodalGraph } from '../nodalCompiler';
import type { NodalGraph } from '../Panes/NodalEditorPane/types';
import type { FlowEditorProps } from '../types';
import { DEFAULT_CODE } from '../types';
import { invalidateVariableCache, preloadVariableSuggestions } from '../utils/variableSuggestions';
import { useDuplicateFlow } from './useDuplicateFlow';
import { useFlowConflictResolution } from './useFlowConflictResolution';
import { useFlowEditorChrome } from './useFlowEditorChrome';
import { useFlowEditorLayout } from './useFlowEditorLayout';
import { useFlowExport } from './useFlowExport';
import { useFlowPersistence } from './useFlowPersistence';
import { useFlowRunsController } from './useFlowRunsController';
import { useLibraryFlowUpdate } from './useLibraryFlowUpdate';
import { getFlowVersionContentUpdatedAt, useFlowVersionHeartbeat } from './useFlowVersionHeartbeat';
import { useSettingsDirtyProtection } from './useSettingsDirtyProtection';

// Coordinates the FlowEditor state, persistence, run controls, and conflict handling.
export function useFlowEditorController({
    flow,
    runs,
    myManualInput,
    canEdit,
    teamTrees = [],
}: FlowEditorProps) {
    const requestedVersionId = typeof window === 'undefined'
        ? null
        : Number.parseInt(new URLSearchParams(window.location.search).get('version') ?? '', 10);
    const initialVersionId = Number.isFinite(requestedVersionId) ? requestedVersionId : null;
    const { currentWorkspace } = usePage<{ currentWorkspace: Workspace | null }>().props;
    const defaultCode = currentWorkspace?.default_flow_code || DEFAULT_CODE;
    const [code, setCode] = useState(flow.code || defaultCode);
    const [savedCode, setSavedCode] = useState(flow.code || defaultCode);
    const [nodalGraph, setNodalGraph] = useState<NodalGraph>(() => normalizeNodalGraph(flow.nodal_graph));
    const [savedNodalGraph, setSavedNodalGraph] = useState<NodalGraph>(() => normalizeNodalGraph(flow.nodal_graph));
    const [nodalGraphRevision, setNodalGraphRevision] = useState(0);
    const [contentUpdatedAt, setContentUpdatedAt] = useState<string | null>(flow.content_updated_at ?? flow.updated_at);
    const [isPublished, setIsPublished] = useState(flow.is_published);
    const [publishedVersion, setPublishedVersion] = useState<number | null>(flow.published_version_number ?? null);
    const [savingPublication, setSavingPublication] = useState(false);
    const [showVersionTimeline, setShowVersionTimeline] = useState(initialVersionId !== null);
    const [timelineVersionId, setTimelineVersionId] = useState<number | null>(initialVersionId);
    const [running, setRunning] = useState(false);
    const flowIdentityRef = useRef({ id: flow.id, contentUpdatedAt: flow.content_updated_at ?? flow.updated_at });
    const layout = useFlowEditorLayout();
    const baseCodeReadOnly = !canEdit || flow.source_type === 'repository' || flow.library_locked;
    const isNodalFlow = flow.flow_type === 'nodal';
    const saved = isNodalFlow
        ? JSON.stringify(nodalGraph) === JSON.stringify(savedNodalGraph)
        : code === savedCode;
    const pendingRunOpenRef = useRef(false);
    const defaultInputsSaveRef = useRef<(() => void) | null>(null);
    const theme = useTheme();
    const { toast } = useToast();
    const { confirm, ConfirmModal } = useConfirm();
    const { handleSettingsDirtyChange, handleSwitchTab } = useSettingsDirtyProtection({
        flowId: flow.id,
        confirm,
        switchTab: layout.switchTab,
    });
    const showToast = useCallback((message: string, variant?: 'success' | 'error' | 'info') => {
        toast(message, variant);
    }, [toast]);
    const chrome = useFlowEditorChrome({ flowId: flow.id, toast: showToast });
    const {
        conflictVersion,
        clearConflict,
        checkNow,
        fetchLatestVersion,
    } = useFlowVersionHeartbeat({
        flowId: flow.id,
        enabled: !baseCodeReadOnly,
        knownContentUpdatedAt: contentUpdatedAt,
    });
    const conflictReadOnly = Boolean(conflictVersion);
    const codeReadOnly = baseCodeReadOnly || conflictReadOnly;
    const handleSavedVersionUpdate = useCallback((savedAt?: string | null) => {
        if (savedAt) {
            setContentUpdatedAt(savedAt);
            clearConflict();
            return;
        }
        void fetchLatestVersion()
            .then(latest => {
                setContentUpdatedAt(getFlowVersionContentUpdatedAt(latest));
                clearConflict();
            })
            .catch(() => {
                setContentUpdatedAt(new Date().toISOString());
                clearConflict();
            });
    }, [clearConflict, fetchLatestVersion]);
    const handleVersionConflict = useCallback(() => {
        void checkNow();
    }, [checkNow]);
    const persistence = useFlowPersistence({
        flowId: flow.id,
        code,
        nodalGraph,
        saved,
        defaultCode,
        hasWorkspaceDefaultCode: Boolean(currentWorkspace?.default_flow_code),
        codeReadOnly: baseCodeReadOnly,
        conflictReadOnly,
        isNodalFlow,
        contentUpdatedAt,
        defaultInputsSaveRef,
        confirm,
        toast: showToast,
        setCode,
        setSavedCode,
        setSavedNodalGraph,
        onSaved: handleSavedVersionUpdate,
        onVersionConflict: handleVersionConflict,
    });
    const handleDownloadFlow = useFlowExport({
        flow,
        isNodalFlow,
        codeRef: persistence.codeRef,
        nodalGraphRef: persistence.nodalGraphRef,
        toast: showToast,
    });
    const conflict = useFlowConflictResolution({
        conflictVersion,
        defaultCode,
        fetchLatestVersion,
        clearConflict,
        handleSaveCode: persistence.handleSaveCode,
        setCode,
        setSavedCode,
        setNodalGraph,
        setSavedNodalGraph,
        setNodalGraphRevision,
        setContentUpdatedAt,
        toast: showToast,
    });
    const runController = useFlowRunsController({
        flowId: flow.id,
        runs,
        myManualInput,
        saved,
        code,
        isNodalFlow,
        codeReadOnly,
        nodalGraphRef: persistence.nodalGraphRef,
        pendingRunOpenRef,
        toast: showToast,
        setRunning,
        flushDraft: persistence.flushDraft,
    });
    const library = useLibraryFlowUpdate(flow, confirm, showToast);
    const duplicate = useDuplicateFlow({ flow, teamTrees, toast: showToast });
    const { flushDraft, getDraftUpdatedAt, nodalGraphRef } = persistence;
    const handlePublish = useCallback(async () => {
        if (!canEdit || savingPublication) return;
        if (flow.library_locked) {
            showToast('Duplicate this library flow before publishing a custom version.', 'info');
            return;
        }
        const repositoryManaged = flow.source_type === 'repository';
        if (isNodalFlow && !repositoryManaged) {
            try {
                compileNodalGraphToCode(normalizeNodalGraph(nodalGraphRef.current));
            } catch {
                showToast('The visual graph cannot be compiled. Fix it before publishing.', 'error');
                return;
            }
        }

        setSavingPublication(true);
        try {
            if (!repositoryManaged && !await flushDraft()) return;
            const response = await fetch(`/flows/${flow.id}/publish`, {
                method: 'POST',
                headers: {
                    ...csrfHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_updated_at: getDraftUpdatedAt(),
                }),
            });
            const result = await response.json() as {
                published_version?: number;
                message?: string;
                errors?: Record<string, string[]>;
            };
            if (!response.ok) {
                const validationMessage = result.errors
                    ? Object.values(result.errors).flat()[0]
                    : result.message;
                showToast(validationMessage || 'Flow could not be published.', 'error');
                return;
            }

            setIsPublished(true);
            setPublishedVersion(result.published_version ?? null);
            showToast(`Flow published as version ${result.published_version}.`, 'success');
        } catch {
            showToast('Flow could not be published. Check your connection and try again.', 'error');
        } finally {
            setSavingPublication(false);
        }
    }, [canEdit, flow.library_locked, flow.source_type, flow.id, flushDraft, getDraftUpdatedAt, isNodalFlow, nodalGraphRef, savingPublication, showToast]);

    const handleUnpublish = useCallback(async () => {
        if (!canEdit || savingPublication || !isPublished) return;

        setSavingPublication(true);
        try {
            const response = await fetch(`/flows/${flow.id}/unpublish`, {
                method: 'POST',
                headers: csrfHeaders(),
            });
            if (!response.ok) throw new Error('Unpublish failed.');
            setIsPublished(false);
            showToast('Flow unpublished.', 'success');
        } catch {
            showToast('Flow could not be unpublished.', 'error');
        } finally {
            setSavingPublication(false);
        }
    }, [canEdit, flow.id, isPublished, savingPublication, showToast]);
    const handleHistoricalVersionPublished = useCallback((versionId: number, version: number) => {
        setIsPublished(true);
        setPublishedVersion(version);
        setTimelineVersionId(versionId);
        showToast(`Version ${version} is now published.`, 'success');
    }, [showToast]);

    useEffect(() => {
        invalidateVariableCache();
        preloadVariableSuggestions();
    }, [flow.id]);

    useEffect(() => {
        if (!savingPublication) {
            setIsPublished(flow.is_published);
            setPublishedVersion(flow.published_version_number ?? null);
        }
    }, [flow.is_published, flow.published_version_number, savingPublication]);

    useEffect(() => {
        if (flowIdentityRef.current.id === flow.id) return;

        const nextContentUpdatedAt = flow.content_updated_at ?? flow.updated_at;
        flowIdentityRef.current = { id: flow.id, contentUpdatedAt: nextContentUpdatedAt };
        setContentUpdatedAt(nextContentUpdatedAt);
        setIsPublished(flow.is_published);
        setPublishedVersion(flow.published_version_number ?? null);
        setSavingPublication(false);
        setShowVersionTimeline(false);
        setTimelineVersionId(null);
        clearConflict();
    }, [clearConflict, flow.content_updated_at, flow.is_published, flow.published_version_number, flow.id, flow.updated_at]);

    const runningRuns = runController.runs.data
        .filter(run => run.status === 'running')
        .map(run => ({ id: run.id, flowId: flow.id }));
    const waitingHumanIds = useWaitingHumanSet(runningRuns);
    useDocumentTitle(flow.name, runController.runs.data, waitingHumanIds);

    return {
        ...layout,
        ...chrome,
        ...persistence,
        ...conflict,
        ...runController,
        ...library,
        ...duplicate,
        code,
        setCode,
        nodalGraph,
        setNodalGraph,
        nodalGraphRevision,
        running,
        saved,
        isPublished,
        publishedVersion,
        savingPublication,
        showVersionTimeline,
        setShowVersionTimeline,
        timelineVersionId,
        setTimelineVersionId,
        isNodalFlow,
        codeReadOnly,
        defaultInputsSaveRef,
        ConfirmModal,
        conflictVersion,
        handleSettingsDirtyChange,
        handleSwitchTab,
        handleDownloadFlow,
        handlePublish,
        handleUnpublish,
        handleHistoricalVersionPublished,
        latestNodalRun: runController.runs.data.find(run => run.input || run.output)
            ?? runController.runs.data[0]
            ?? null,
        visibilityColor: flow.visibility === 'owner'
            ? theme.colors.accent.warning
            : flow.visibility === 'team'
                ? theme.colors.accent.success
                : theme.colors.accent.info,
    };
}

export type FlowEditorController = ReturnType<typeof useFlowEditorController>;
