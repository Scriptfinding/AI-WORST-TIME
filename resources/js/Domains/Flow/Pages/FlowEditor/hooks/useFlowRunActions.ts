import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { FormDataConvertible } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import type { FlowRun } from '@/Domains/Flow/types';
import type { useToast } from '@/App/Hooks/useToast';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { compileNodalGraphToCode } from '@/Domains/Flow/Pages/FlowEditor/nodalCompiler';

type ToastFn = ReturnType<typeof useToast>['toast'];

type RunModalOptions = {
    prefillInput?: string;
    codeSnapshot?: string | null;
    rerunData?: string | null;
};

interface UseFlowRunActionsOptions {
    flowId: Id;
    myManualInput: Record<string, unknown> | null;
    saved: boolean;
    code: string;
    isNodalFlow: boolean;
    codeReadOnly: boolean;
    nodalGraphRef: MutableRefObject<NodalGraph>;
    pendingRunOpenRef: MutableRefObject<boolean>;
    toast: ToastFn;
    setRunning: (running: boolean) => void;
    flushDraft: (force?: boolean) => Promise<boolean>;
    onRunCancellationStarted: (runId: number) => void;
    onRunCancellationFailed: (runId: number) => void;
}

// Executes run, cancel, retry, and cleanup actions from the flow editor.
export function useFlowRunActions({
    flowId,
    myManualInput,
    saved,
    code,
    isNodalFlow,
    codeReadOnly,
    nodalGraphRef,
    pendingRunOpenRef,
    toast,
    setRunning,
    flushDraft,
    onRunCancellationStarted,
    onRunCancellationFailed,
}: UseFlowRunActionsOptions) {
    const [showRunModal, setShowRunModal] = useState(false);
    const [runInitialInput, setRunInitialInput] = useState('{}');
    const [rerunCodeSnapshot, setRerunCodeSnapshot] = useState<string | null>(null);
    const [rerunData, setRerunData] = useState<string | null>(null);
    const [showSaveBeforeRun, setShowSaveBeforeRun] = useState(false);
    const [pendingRunArgs, setPendingRunArgs] = useState<RunModalOptions | null>(null);
    const [clearing, setClearing] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const localManualInputRef = useRef(myManualInput);
    const openRunModalRef = useRef<(opts?: RunModalOptions) => void>(() => {});

    useEffect(() => {
        localManualInputRef.current = myManualInput;
    }, [myManualInput]);

    useEffect(() => {
        const handleGlobalRun = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                openRunModalRef.current();
            }
        };
        window.addEventListener('keydown', handleGlobalRun);
        return () => window.removeEventListener('keydown', handleGlobalRun);
    }, []);

    const openRunModalDirect = useCallback((opts?: RunModalOptions) => {
        const lastInput = localManualInputRef.current;
        setRunInitialInput(opts?.prefillInput || (lastInput ? JSON.stringify(lastInput, null, 2) : '{}'));
        setRerunCodeSnapshot(opts?.codeSnapshot ?? null);
        setRerunData(opts?.rerunData ?? null);
        setShowRunModal(true);
    }, []);

    const openRunModal = useCallback((opts?: RunModalOptions) => {
        if (!saved) {
            setPendingRunArgs(opts ?? null);
            setShowSaveBeforeRun(true);
            return;
        }
        openRunModalDirect(opts);
    }, [openRunModalDirect, saved]);

    openRunModalRef.current = openRunModal;

    const handleRunFromModal = useCallback((parsedInput: Record<string, unknown>, useOldCode: boolean) => {
        let codeOverride: string;
        try {
            codeOverride = useOldCode && rerunCodeSnapshot
                ? rerunCodeSnapshot
                : isNodalFlow
                    ? compileNodalGraphToCode(nodalGraphRef.current, { instrumentRunProgress: true })
                    : code;
        } catch (error) {
            toast(error instanceof Error ? error.message : 'The visual flow cannot be compiled.', 'error');
            return;
        }

        setShowRunModal(false);
        setRunning(true);
        pendingRunOpenRef.current = true;
        const payload: Record<string, FormDataConvertible> = {
            input: parsedInput as FormDataConvertible,
            code_override: codeOverride,
        };
        if (rerunData) {
            payload.is_rerun = true;
        }
        router.post(`/flows/${flowId}/run`, payload, {
            onFinish: () => setRunning(false),
        });
    }, [code, flowId, isNodalFlow, nodalGraphRef, pendingRunOpenRef, rerunCodeSnapshot, rerunData, setRunning, toast]);

    const handleSaveInput = useCallback((parsedInput: Record<string, unknown>) => {
        const isEmpty = Object.keys(parsedInput).length === 0;
        localManualInputRef.current = isEmpty ? null : parsedInput;
        router.put(`/flows/${flowId}/input`, { input: parsedInput as FormDataConvertible }, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [flowId]);

    const handleSaveAndRun = useCallback(() => {
        if (codeReadOnly) {
            toast('Resolve the external flow update before saving and running.', 'error');
            return;
        }

        // flushDraft cancels the autosave debounce and awaits any in-flight save,
        // so this cannot race the autosave request. It reports its own errors.
        void flushDraft().then(succeeded => {
            if (!succeeded) return;
            setShowSaveBeforeRun(false);
            openRunModalDirect(pendingRunArgs ?? undefined);
            setPendingRunArgs(null);
        });
    }, [codeReadOnly, flushDraft, openRunModalDirect, pendingRunArgs, toast]);

    const handleRunWithoutSaving = useCallback(() => {
        setShowSaveBeforeRun(false);
        openRunModalDirect(pendingRunArgs ?? undefined);
        setPendingRunArgs(null);
    }, [openRunModalDirect, pendingRunArgs]);

    const handleRerunFromDetail = useCallback((rerunInput: string, codeSnapshot: string | null) => {
        openRunModal({
            codeSnapshot,
            rerunData: rerunInput,
        });
    }, [openRunModal]);

    const handleClearAllRuns = useCallback(() => {
        setClearing(true);
        router.delete(`/flows/${flowId}/runs`, {
            preserveState: true,
            onFinish: () => {
                setClearing(false);
                setShowClearModal(false);
            },
        });
    }, [flowId]);

    const handleDeleteSelectedRuns = useCallback((ids: number[]) => {
        setClearing(true);
        router.post(`/flows/${flowId}/runs/batch-delete`, { ids }, {
            preserveState: true,
            onFinish: () => setClearing(false),
        });
    }, [flowId]);

    const handleKillRun = useCallback((run: FlowRun) => {
        onRunCancellationStarted(run.id);
        setRunning(false);
        router.post(`/flows/${flowId}/runs/${run.id}/kill`, {}, {
            preserveState: true,
            onError: () => onRunCancellationFailed(run.id),
        });
    }, [flowId, onRunCancellationFailed, onRunCancellationStarted, setRunning]);

    return {
        showRunModal,
        runInitialInput,
        rerunCodeSnapshot,
        rerunData,
        showSaveBeforeRun,
        clearing,
        showClearModal,
        openRunModal,
        closeRunModal: () => setShowRunModal(false),
        closeSaveBeforeRun: () => {
            setShowSaveBeforeRun(false);
            setPendingRunArgs(null);
        },
        openClearModal: () => setShowClearModal(true),
        closeClearModal: () => setShowClearModal(false),
        handleRunFromModal,
        handleSaveInput,
        handleSaveAndRun,
        handleRunWithoutSaving,
        handleRerunFromDetail,
        handleClearAllRuns,
        handleDeleteSelectedRuns,
        handleKillRun,
    };
}
