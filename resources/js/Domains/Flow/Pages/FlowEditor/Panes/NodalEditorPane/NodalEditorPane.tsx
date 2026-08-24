import type { NodalEditorPaneProps } from './NodalEditorPane.types';
import { useNodalEditorPaneController } from './hooks/useNodalEditorPaneController';
import Toolbar from './components/Toolbar/Toolbar';
import NodalEditorCanvas from './components/NodalEditorCanvas';
import * as S from './styled';

function NodalEditorPane(props: NodalEditorPaneProps) {
    const {
        flow,
        saved,
        onRun,
        onOpenLibraryStore,
        onDownloadFlow,
        onDuplicateFlow,
        leftView = 'code',
        onSwitchView,
        sidePanelOpen,
        onToggleSidePanel,
        onSave,
        saveStatus = 'saved',
        publishedVersion = null,
        onPublish,
        onUnpublish,
        onViewTimeline,
        savingPublication = false,
        publicationEditable = false,
        saveButtonStyle = 'toolbar',
        readOnly = false,
        documentExtension = 'flow',
    } = props;
    const controller = useNodalEditorPaneController(props);

    return (
        <S.Wrapper>
            <S.Column>
                <Toolbar
                    flow={flow}
                    saved={saved}
                    readOnly={readOnly}
                    documentExtension={documentExtension}
                    leftView={leftView}
                    sidePanelOpen={sidePanelOpen}
                    onSave={onSave}
                    isPublished={flow.is_published}
                    saveStatus={saveStatus}
                    publishedVersion={publishedVersion}
                    onPublish={onPublish}
                    onUnpublish={onUnpublish}
                    onViewTimeline={onViewTimeline}
                    savingPublication={savingPublication}
                    publicationEditable={publicationEditable}
                    saveButtonStyle={saveButtonStyle}
                    onRun={onRun}
                    onOpenLibraryStore={onOpenLibraryStore}
                    onDownloadFlow={onDownloadFlow}
                    onDuplicateFlow={onDuplicateFlow}
                    onSwitchView={onSwitchView}
                    onToggleSidePanel={onToggleSidePanel}
                />
                <NodalEditorCanvas controller={controller} />
            </S.Column>
        </S.Wrapper>
    );
}

export default NodalEditorPane;
