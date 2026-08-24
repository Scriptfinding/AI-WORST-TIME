import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { router } from '@inertiajs/react';
import { useBeforeUnloadProtection } from '@/Shared/Hooks/useBeforeUnloadProtection';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { FlowEditorProps } from '@/Domains/Flow/Pages/FlowEditor/types';
import { compileNodalGraphToCode, normalizeNodalGraph } from '@/Domains/Flow/Pages/FlowEditor/nodalCompiler';

type ConfirmFn = (options: {
    title: string;
    message: string;
    confirmLabel: string;
    variant?: 'danger';
}) => Promise<boolean>;

type ToastFn = (message: string, variant?: 'success' | 'error' | 'info') => void;

interface UseFlowPersistenceOptions {
    flowId: FlowEditorProps['flow']['id'];
    code: string;
    nodalGraph: NodalGraph;
    saved: boolean;
    defaultCode: string;
    hasWorkspaceDefaultCode: boolean;
    codeReadOnly: boolean;
    conflictReadOnly: boolean;
    isNodalFlow: boolean;
    contentUpdatedAt: string | null;
    defaultInputsSaveRef: MutableRefObject<(() => void) | null>;
    confirm: ConfirmFn;
    toast: ToastFn;
    setCode: (code: string) => void;
    setSavedCode: (code: string) => void;
    setSavedNodalGraph: (graph: NodalGraph) => void;
    onSaved?: (contentUpdatedAt?: string | null) => void;
    onVersionConflict?: () => void;
}

interface SaveCodeOptions {
    force?: boolean;
    onFinish?: () => void;
    onSuccess?: () => void;
}

export type DraftSaveStatus = 'saved' | 'unsaved' | 'saving' | 'error' | 'conflict';

const AUTOSAVE_DELAY_MS = 1000;

// Saves code or nodal content while handling validation and version conflicts.
export function useFlowPersistence({
    flowId,
    code,
    nodalGraph,
    saved,
    defaultCode,
    hasWorkspaceDefaultCode,
    codeReadOnly,
    conflictReadOnly,
    isNodalFlow,
    contentUpdatedAt,
    defaultInputsSaveRef,
    confirm,
    toast,
    setCode,
    setSavedCode,
    setSavedNodalGraph,
    onSaved,
    onVersionConflict,
}: UseFlowPersistenceOptions) {
    const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>('saved');
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveRequestRef = useRef<Promise<boolean> | null>(null);
    const allowNavigationRef = useRef(false);
    const codeRef = useRef(code);
    codeRef.current = code;
    const nodalGraphRef = useRef(nodalGraph);
    nodalGraphRef.current = nodalGraph;
    const contentUpdatedAtRef = useRef(contentUpdatedAt);
    contentUpdatedAtRef.current = contentUpdatedAt;
    const getDraftUpdatedAt = useCallback(() => contentUpdatedAtRef.current, []);

    const contentKey = useCallback(() => (
        isNodalFlow
            ? JSON.stringify(normalizeNodalGraph(nodalGraphRef.current))
            : codeRef.current
    ), [isNodalFlow]);
    const savedContentKeyRef = useRef(contentKey());

    const handleResetToDefault = useCallback(async () => {
        if (await confirm({
            title: 'Reset to Default',
            message: hasWorkspaceDefaultCode
                ? 'Reset the code to the workspace default template? Unsaved changes will be lost.'
                : 'Reset the code to the built-in template? Unsaved changes will be lost.',
            confirmLabel: 'Reset',
            variant: 'danger',
        })) {
            setCode(defaultCode);
        }
    }, [confirm, defaultCode, hasWorkspaceDefaultCode, setCode]);

    const handleCodeChange = useCallback((value: string | undefined) => {
        if (value === undefined) return;
        setCode(value);
    }, [setCode]);

    const saveLatestDraft = useCallback(async (force = false): Promise<boolean> => {
        if (codeReadOnly || (conflictReadOnly && !force)) return false;
        if (saveRequestRef.current) {
            const previousSucceeded = await saveRequestRef.current;
            if (!previousSucceeded || contentKey() === savedContentKeyRef.current) {
                return previousSucceeded;
            }
        }

        const currentNodalGraph = normalizeNodalGraph(nodalGraphRef.current);
        let currentCode = codeRef.current;
        if (isNodalFlow) {
            try {
                currentCode = compileNodalGraphToCode(currentNodalGraph);
            } catch {
                currentCode = codeRef.current;
            }
        }
        const capturedKey = isNodalFlow ? JSON.stringify(currentNodalGraph) : currentCode;
        const payload: Record<string, unknown> = { code: currentCode };
        if (contentUpdatedAtRef.current) {
            payload.client_updated_at = contentUpdatedAtRef.current;
        }
        if (force) {
            payload.force_current_version = true;
        }
        if (isNodalFlow) {
            payload.nodal_graph = currentNodalGraph;
        }

        setSaveStatus('saving');
        const request = fetch(`/flows/${flowId}/code`, {
            method: 'PUT',
            headers: {
                ...csrfHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        }).then(async response => {
            if (response.ok) {
                const result = await response.json() as {
                    content_updated_at?: string | null;
                    updated_at?: string | null;
                };
                if (isNodalFlow) {
                    setCode(currentCode);
                }
                setSavedCode(currentCode);
                if (isNodalFlow) {
                    setSavedNodalGraph(currentNodalGraph);
                }
                savedContentKeyRef.current = capturedKey;
                const nextTimestamp = result.content_updated_at ?? result.updated_at ?? null;
                contentUpdatedAtRef.current = nextTimestamp;
                onSaved?.(nextTimestamp);
                setSaveStatus(contentKey() === capturedKey ? 'saved' : 'unsaved');

                return true;
            }

            if (response.status === 422) {
                const result = await response.json() as { errors?: Record<string, string[]> };
                if (result.errors?.client_updated_at) {
                    setSaveStatus('conflict');
                    onVersionConflict?.();

                    return false;
                }
            }

            setSaveStatus('error');
            toast('Draft could not be saved. Your changes are still in the editor.', 'error');

            return false;
        }).catch(() => {
            setSaveStatus('error');
            toast('Draft could not be saved. Check your connection and try again.', 'error');

            return false;
        }).finally(() => {
            saveRequestRef.current = null;
        });
        saveRequestRef.current = request;

        return request;
    }, [codeReadOnly, conflictReadOnly, contentKey, flowId, isNodalFlow, onSaved, onVersionConflict, setCode, setSavedCode, setSavedNodalGraph, toast]);

    const flushDraft = useCallback(async (force = false): Promise<boolean> => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }
        if (!force && contentKey() === savedContentKeyRef.current) {
            setSaveStatus('saved');
            return true;
        }
        let succeeded = true;
        do {
            succeeded = await saveLatestDraft(force);
        } while (succeeded && contentKey() !== savedContentKeyRef.current);

        return succeeded;
    }, [contentKey, saveLatestDraft]);

    const handleSaveCode = useCallback((options: SaveCodeOptions = {}) => {
        void flushDraft(Boolean(options.force)).then(succeeded => {
            if (succeeded) options.onSuccess?.();
        }).finally(options.onFinish);
    }, [flushDraft]);

    useEffect(() => {
        if (codeReadOnly || conflictReadOnly || saved) return;

        setSaveStatus(status => status === 'saving' ? status : 'unsaved');
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            saveTimeoutRef.current = null;
            void flushDraft();
        }, AUTOSAVE_DELAY_MS);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
        };
    }, [code, nodalGraph, codeReadOnly, conflictReadOnly, flushDraft, saved]);

    useEffect(() => {
        const handleGlobalSave = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 's') {
                event.preventDefault();
                const inDefaultInputs = document.activeElement?.closest('[data-default-inputs-editor]');
                if (inDefaultInputs && defaultInputsSaveRef.current) {
                    defaultInputsSaveRef.current();
                } else {
                    handleSaveCode();
                }
            }
        };
        window.addEventListener('keydown', handleGlobalSave);
        return () => window.removeEventListener('keydown', handleGlobalSave);
    }, [defaultInputsSaveRef, handleSaveCode]);

    useEffect(() => {
        if (saved && saveStatus !== 'saving') return;

        return router.on('before', event => {
            const visit = event.detail.visit;
            const isCurrentPage = visit.url.pathname === window.location.pathname
                && visit.url.search === window.location.search;
            const isFlowMutation = visit.method !== 'get'
                && visit.url.pathname.startsWith(`/flows/${flowId}`);
            if (allowNavigationRef.current || visit.prefetch || isCurrentPage || isFlowMutation) return;

            event.preventDefault();
            void flushDraft().then(succeeded => {
                if (!succeeded) return;

                allowNavigationRef.current = true;
                router.visit(visit.url, {
                    method: visit.method,
                    data: visit.data,
                    replace: visit.replace,
                    preserveScroll: visit.preserveScroll,
                    preserveState: visit.preserveState,
                    only: visit.only,
                    except: visit.except,
                    headers: visit.headers,
                    errorBag: visit.errorBag,
                    forceFormData: visit.forceFormData,
                    queryStringArrayFormat: visit.queryStringArrayFormat,
                    async: visit.async,
                    showProgress: visit.showProgress,
                    fresh: visit.fresh,
                    reset: visit.reset,
                    preserveUrl: visit.preserveUrl,
                    invalidateCacheTags: visit.invalidateCacheTags,
                    viewTransition: visit.viewTransition,
                    onFinish: () => {
                        allowNavigationRef.current = false;
                    },
                });
            });
        });
    }, [flowId, flushDraft, saveStatus, saved]);

    useBeforeUnloadProtection({ active: !saved || saveStatus === 'saving' || saveStatus === 'error' });

    return {
        codeRef,
        nodalGraphRef,
        saveStatus,
        flushDraft,
        getDraftUpdatedAt,
        handleCodeChange,
        handleResetToDefault,
        handleSaveCode,
    };
}
