import type { Flow, FlowRun } from '@/Domains/Flow/types';
import type { DraftSaveStatus } from '@/Domains/Flow/Pages/FlowEditor/hooks/useFlowPersistence';
import type { NodalGraph, NodalGraphContext } from './types';

export interface NodalEditorPaneProps {
    flow: Flow;
    saved: boolean;
    onRun?: () => void;
    onOpenLibraryStore?: () => void;
    onDownloadFlow?: () => void;
    onDuplicateFlow?: () => void;
    leftView?: 'welcome' | 'code';
    onSwitchView?: (view: 'welcome' | 'code') => void;
    sidePanelOpen?: boolean;
    onToggleSidePanel?: () => void;
    graph: NodalGraph;
    graphContext?: NodalGraphContext;
    functionArguments?: string[];
    documentExtension?: string;
    graphRevision?: number;
    onGraphChange: (graph: NodalGraph) => void;
    latestRun?: FlowRun | null;
    onSave?: () => void;
    saveStatus?: DraftSaveStatus;
    publishedVersion?: number | null;
    onPublish?: () => void;
    onUnpublish?: () => void;
    onViewTimeline?: () => void;
    savingPublication?: boolean;
    publicationEditable?: boolean;
    saveButtonStyle?: 'toolbar' | 'standard';
    readOnly?: boolean;
    allowShortcutsInModal?: boolean;
    runProgress?: {
        activeNodeId: string | null;
        passedNodeIds: Set<string>;
        nodePassCounts: Map<string, number>;
        errorNodeId?: string | null;
        activeLine?: number | null;
        passedLines?: Set<number> | number[];
        errorLine?: number | null;
        codeSnapshot?: string | null;
    } | null;
}
