import type { Flow } from '@/Domains/Flow/types';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { DraftSaveStatus } from '@/Domains/Flow/Pages/FlowEditor/hooks/useFlowPersistence';

export interface CodeEditorPaneProps {
    flow: Flow;
    code: string;
    saved: boolean;
    hidden: boolean;
    onCodeChange: (value: string | undefined) => void;
    onSave: () => void;
    saveStatus: DraftSaveStatus;
    publishedVersion: number | null;
    onPublish: () => void;
    onUnpublish: () => void;
    onViewTimeline: () => void;
    savingPublication: boolean;
    publicationEditable: boolean;
    onRun?: () => void;
    onResetToDefault?: () => void;
    onUpdateLibrarySource?: () => void;
    updatingLibrarySource?: boolean;
    onCheckLibraryUpdate?: () => void;
    checkingLibraryUpdate?: boolean;
    onOpenLibraryStore?: () => void;
    onDownloadFlow?: () => void;
    onDuplicateFlow?: () => void;
    readOnly?: boolean;
    leftView?: 'welcome' | 'code';
    onSwitchView?: (view: 'welcome' | 'code') => void;
    sidePanelOpen?: boolean;
    onToggleSidePanel?: () => void;
}

export interface EvaluationResult {
    entry: HelpEntryDef;
    result: unknown;
    error?: string;
}
