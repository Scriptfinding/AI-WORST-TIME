import { Icon } from '@/Shared/UI/Icon/Icon';
import type { Flow } from '@/Domains/Flow/types';
import Button from '@/Shared/UI/Button/Button';
import PublicationMenu from '@/Domains/Flow/Pages/FlowEditor/components/PublicationMenu/PublicationMenu';
import type { DraftSaveStatus } from '@/Domains/Flow/Pages/FlowEditor/hooks/useFlowPersistence';
import * as S from './styled';

interface ToolbarProps {
    flow: Flow;
    saved: boolean;
    readOnly?: boolean;
    leftView: 'welcome' | 'code';
    sidePanelOpen?: boolean;
    onSave?: () => void;
    isPublished?: boolean;
    saveStatus?: DraftSaveStatus;
    publishedVersion?: number | null;
    onPublish?: () => void;
    onUnpublish?: () => void;
    onViewTimeline?: () => void;
    savingPublication?: boolean;
    publicationEditable?: boolean;
    saveButtonStyle?: 'toolbar' | 'standard';
    onRun?: () => void;
    onOpenLibraryStore?: () => void;
    onDownloadFlow?: () => void;
    onDuplicateFlow?: () => void;
    onSwitchView?: (view: 'welcome' | 'code') => void;
    onToggleSidePanel?: () => void;
    documentExtension?: string;
}

export default function Toolbar({
    flow,
    saved,
    readOnly,
    leftView,
    sidePanelOpen,
    onSave,
    isPublished,
    saveStatus = 'saved',
    publishedVersion = null,
    onPublish,
    onUnpublish,
    onViewTimeline,
    savingPublication = false,
    publicationEditable = false,
    saveButtonStyle = 'toolbar',
    onRun,
    onOpenLibraryStore,
    onDownloadFlow,
    onDuplicateFlow,
    onSwitchView,
    onToggleSidePanel,
    documentExtension = 'flow',
}: ToolbarProps) {
    return (
        <S.Toolbar>
            <S.ToolbarLeft>
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
                            title="Visual Builder"
                        >
                            <Icon icon="lucide:workflow" width={13} height={13} />
                        </S.ViewToggleTab>
                    </S.ViewToggle>
                )}
                <S.FileName>{flow.name}.{documentExtension}</S.FileName>
                <S.SavedIndicator $saved={saved}>
                    {saved ? 'Saved' : 'Unsaved changes'}
                </S.SavedIndicator>
            </S.ToolbarLeft>

            <S.ToolbarRight>
                {(!onPublish || !onUnpublish || typeof isPublished !== 'boolean')
                    && !readOnly && onSave && saveButtonStyle === 'standard' && (
                    <Button type="button" size="sm" disabled={saved} onClick={onSave}>
                        Save
                    </Button>
                )}
                {(!onPublish || !onUnpublish || typeof isPublished !== 'boolean')
                    && !readOnly && onSave && saveButtonStyle === 'toolbar' && (
                    <S.ToolbarBadge onClick={onSave} $disabled={saved} title="Save visual graph">
                        <Icon icon="lucide:save" />
                        <S.ToolbarBadgeLabel>Save</S.ToolbarBadgeLabel>
                    </S.ToolbarBadge>
                )}
                {typeof isPublished === 'boolean' && onPublish && onUnpublish && onViewTimeline && onSave && (
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
                )}
                {onRun && (
                    <S.ToolbarBadge onClick={onRun} title="Run Flow">
                        <Icon icon="lucide:play" />
                        <S.ToolbarBadgeLabel>Run</S.ToolbarBadgeLabel>
                    </S.ToolbarBadge>
                )}
                {onOpenLibraryStore && (
                    <S.ToolbarBadge
                        onClick={onOpenLibraryStore}
                        data-tooltip="Open Blueprints"
                        aria-label="Open Blueprints"
                    >
                        <Icon icon="lucide:store" />
                    </S.ToolbarBadge>
                )}
                {onDownloadFlow && (
                    <S.ToolbarBadge
                        onClick={onDownloadFlow}
                        data-tooltip="Download JSON file"
                        aria-label="Download JSON file"
                    >
                        <Icon icon="lucide:download" />
                    </S.ToolbarBadge>
                )}
                {onDuplicateFlow && (
                    <S.ToolbarBadge
                        onClick={onDuplicateFlow}
                        data-tooltip="Clone this flow"
                        data-tooltip-align="right"
                        aria-label="Clone this flow"
                    >
                        <Icon icon="lucide:copy-plus" />
                    </S.ToolbarBadge>
                )}
                {onToggleSidePanel && (
                    <S.SidePanelToggleWrap>
                        <S.ToolbarBadge
                            onClick={onToggleSidePanel}
                            $active={sidePanelOpen}
                            title={sidePanelOpen ? 'Hide side panel' : 'Show side panel'}
                        >
                            <Icon icon={sidePanelOpen ? 'lucide:panel-right-close' : 'lucide:panel-right-open'} />
                        </S.ToolbarBadge>
                    </S.SidePanelToggleWrap>
                )}
            </S.ToolbarRight>
        </S.Toolbar>
    );
}
