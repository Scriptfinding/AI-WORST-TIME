import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { normalizeNodalGraph } from '@/Domains/Flow/Pages/FlowEditor/nodalCompiler';
import {
    castNodalGraph,
    getFlowVersionContentUpdatedAt,
    type FlowVersionSnapshot,
} from './useFlowVersionHeartbeat';

interface SaveCodeOptions {
    force?: boolean;
    onFinish?: () => void;
    onSuccess?: () => void;
}

interface UseFlowConflictResolutionOptions {
    conflictVersion: FlowVersionSnapshot | null;
    defaultCode: string;
    fetchLatestVersion: () => Promise<FlowVersionSnapshot>;
    clearConflict: () => void;
    handleSaveCode: (options?: SaveCodeOptions) => void;
    setCode: Dispatch<SetStateAction<string>>;
    setSavedCode: Dispatch<SetStateAction<string>>;
    setNodalGraph: Dispatch<SetStateAction<NodalGraph>>;
    setSavedNodalGraph: Dispatch<SetStateAction<NodalGraph>>;
    setNodalGraphRevision: Dispatch<SetStateAction<number>>;
    setContentUpdatedAt: Dispatch<SetStateAction<string | null>>;
    toast: (message: string, variant?: 'success' | 'error' | 'info') => void;
}

// Resolves concurrent flow edits by reloading or taking over the latest version.
export function useFlowConflictResolution({
    conflictVersion,
    defaultCode,
    fetchLatestVersion,
    clearConflict,
    handleSaveCode,
    setCode,
    setSavedCode,
    setNodalGraph,
    setSavedNodalGraph,
    setNodalGraphRevision,
    setContentUpdatedAt,
    toast,
}: UseFlowConflictResolutionOptions) {
    const [resolvingConflict, setResolvingConflict] = useState<'refresh' | 'save' | null>(null);

    const handleRefreshLatestFlowVersion = useCallback(async () => {
        setResolvingConflict('refresh');

        try {
            const latest = conflictVersion ?? await fetchLatestVersion();
            const latestCode = latest.code || defaultCode;
            const latestGraph = normalizeNodalGraph(castNodalGraph(latest.nodal_graph));

            setCode(latestCode);
            setSavedCode(latestCode);
            setNodalGraph(latestGraph);
            setSavedNodalGraph(latestGraph);
            setNodalGraphRevision(revision => revision + 1);
            setContentUpdatedAt(getFlowVersionContentUpdatedAt(latest));
            clearConflict();
            toast('Flow refreshed with the latest saved version.', 'success');
        } catch {
            toast('Unable to refresh the latest flow version.', 'error');
        } finally {
            setResolvingConflict(null);
        }
    }, [
        clearConflict,
        conflictVersion,
        defaultCode,
        fetchLatestVersion,
        setCode,
        setContentUpdatedAt,
        setNodalGraph,
        setNodalGraphRevision,
        setSavedCode,
        setSavedNodalGraph,
        toast,
    ]);

    const handleKeepCurrentFlowVersion = useCallback(() => {
        setResolvingConflict('save');
        handleSaveCode({
            force: true,
            onSuccess: () => {
                clearConflict();
            },
            onFinish: () => {
                setResolvingConflict(null);
            },
        });
    }, [clearConflict, handleSaveCode]);

    return {
        resolvingConflict,
        handleRefreshLatestFlowVersion,
        handleKeepCurrentFlowVersion,
    };
}
