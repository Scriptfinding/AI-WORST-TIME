import { Icon } from '@/Shared/UI/Icon/Icon';
import { ToolbarBadge } from '@/Shared/CodeEditor/shared/toolbar.styled';
import PublicationMenu from '@/Domains/Flow/Pages/FlowEditor/components/PublicationMenu/PublicationMenu';
import type { DraftSaveStatus } from '@/Domains/Flow/Pages/FlowEditor/hooks/useFlowPersistence';
import * as S from './styled';

interface EditorToolbarProps {
    flowName: string;
    saved: boolean;
    readOnly: boolean;
    leftView: 'welcome' | 'code';
    sidePanelOpen?: boolean;
    onSave: () => void;
    isPublished: boolean;
    publishedVersion: number | null;
    saveStatus: DraftSaveStatus;
    onPublish: () => void;
    onUnpublish: () => void;
    onViewTimeline: () => void;
    savingPublication: boolean;
    publicationEditable: boolean;
    onSwitchView?: (view: 'welcome' | 'code') => void;
    onOpenLibraryStore?: () => void;
    onDownloadFlow?: () => void;
    onDuplicateFlow?: () => void;
    onResetToDefault?: () => void;
    onToggleSidePanel?: () => void;
}

export function EditorToolbar({
    flowName,
    saved,
    readOnly,
    leftView,
    sidePanelOpen,
    onSave,
    isPublished,
    publishedVersion,
    saveStatus,
    onPublish,
    onUnpublish,
    onViewTimeline,
    savingPublication,
    publicationEditable,
    onSwitchView,
    onOpenLibraryStore,
    onDownloadFlow,
    onDuplicateFlow,
    onResetToDefault,
    onToggleSidePanel,
}: EditorToolbarProps) {
    return (
        <S.Toolbar>
            <S.Left>
                {onSwitchView && (
                    <S.ViewToggle>
                        <S.ViewToggleTab
                            $active={leftView === 'welcome'}
                            onClick={() => onSwitchView('welcome')}
                            title="Welcome"
                        >
                            <Icon icon="lucide:book-open" width={13} height={13} />
                        </S.ViewToggleTab>
                        <S.ViewToggleTab
                            $active={leftView === 'code'}
                            onClick={() => onSwitchView('code')}
                            title="Code editor"
                        >
                            <Icon icon="lucide:code-2" width={13} height={13} />
                        </S.ViewToggleTab>
                    </S.ViewToggle>
                )}
                <S.FileName>{flowName}.js</S.FileName>
                <S.SavedIndicator $saved={saved}>
                    {saved ? 'Saved' : 'Unsaved changes'}
                </S.SavedIndicator>
            </S.Left>
            <S.Right>
                <PublicationMenu
                    isPublished={isPublished}
                    publishedVersion={publishedVersion}
                    saveStatus={saveStatus}
                    draftEditable={!readOnly}
                    publicationEditable={publicationEditable}
                    savingPublication={savingPublication}
                    onSaveDraft={onSave}
                    onPublish={onPublish}
                    onUnpublish={onUnpublish}
                    onViewTimeline={onViewTimeline}
                />
                {onOpenLibraryStore && (
                    <ToolbarBadge
                        onClick={onOpenLibraryStore}
                        data-tooltip="Open Blueprints"
                        aria-label="Open Blueprints"
                    >
                        <Icon icon="lucide:store" />
                    </ToolbarBadge>
                )}
                {onDownloadFlow && (
                    <ToolbarBadge
                        onClick={onDownloadFlow}
                        data-tooltip="Download JS file"
                        aria-label="Download JS file"
                    >
                        <Icon icon="lucide:download" />
                    </ToolbarBadge>
                )}
                {onDuplicateFlow && (
                    <ToolbarBadge
                        onClick={onDuplicateFlow}
                        data-tooltip="Clone this flow"
                        data-tooltip-align="right"
                        aria-label="Clone this flow"
                    >
                        <Icon icon="lucide:copy-plus" />
                    </ToolbarBadge>
                )}
                {!readOnly && onResetToDefault && (
                    <ToolbarBadge
                        onClick={onResetToDefault}
                        title="Reset code to default template"
                    >
                        <Icon icon="lucide:rotate-ccw" />
                    </ToolbarBadge>
                )}
                {onToggleSidePanel && (
                    <S.SidePanelToggleWrap>
                        <ToolbarBadge
                            onClick={onToggleSidePanel}
                            $active={sidePanelOpen}
                            title={sidePanelOpen ? 'Hide side panel' : 'Show side panel'}
                        >
                            <Icon icon={sidePanelOpen ? 'lucide:panel-right-close' : 'lucide:panel-right-open'} />
                        </ToolbarBadge>
                    </S.SidePanelToggleWrap>
                )}
            </S.Right>
        </S.Toolbar>
    );
}
