import { useMemo } from 'react';
import type { Flow } from '@/Domains/Flow/types';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import NodalEditorPane from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodalEditorPane';
import * as Layout from '@/Domains/Snippet/Pages/shared.styled';
import { SourceBanner } from './components/SourceBanner/SourceBanner';

interface Props {
    id: Id;
    args: string;
    graph: NodalGraph;
    dirty: boolean;
    mobileView: string;
    readOnly: boolean;
    onGraphChange: (graph: NodalGraph) => void;
    onSave: () => void;
    onOpenLibraryStore?: () => void;
    onDownloadSnippet?: () => void;
    onDuplicateSnippet?: () => void;
    libraryLocked?: boolean;
    libraryUpdateAvailable?: boolean;
    updatingLibrarySource?: boolean;
    checkingLibraryUpdate?: boolean;
    onUpdateLibrarySource?: () => void;
    onCheckLibraryUpdate?: () => void;
}

export default function SnippetNodalEditor({
    id,
    args,
    graph,
    dirty,
    mobileView,
    readOnly,
    onGraphChange,
    onSave,
    onOpenLibraryStore,
    onDownloadSnippet,
    onDuplicateSnippet,
    libraryLocked = false,
    libraryUpdateAvailable = false,
    updatingLibrarySource = false,
    checkingLibraryUpdate = false,
    onUpdateLibrarySource,
    onCheckLibraryUpdate,
}: Props) {
    const functionArguments = useMemo(
        () => args.split(',').map(argument => argument.trim()).filter(Boolean),
        [args],
    );
    const flow = useMemo(() => ({
        id,
        name: String(id),
        default_inputs: Object.fromEntries(functionArguments.map(argument => [argument, undefined])),
        latest_run: null,
        viewport_width: 1280,
        viewport_height: 720,
        keyboard_speed: 100,
        flow_type: 'nodal',
        nodal_graph: graph,
    } as Flow), [functionArguments, graph, id]);

    return (
        <Layout.Panel $mobileHidden={mobileView !== 'editor'}>
            {libraryLocked && (
                <SourceBanner
                    updateAvailable={libraryUpdateAvailable}
                    updating={updatingLibrarySource}
                    checking={checkingLibraryUpdate}
                    onUpdate={onUpdateLibrarySource}
                    onCheck={onCheckLibraryUpdate}
                />
            )}
            <NodalEditorPane
                flow={flow}
                saved={!dirty}
                graph={graph}
                graphContext="function"
                functionArguments={functionArguments}
                documentExtension="snippet.json"
                onGraphChange={onGraphChange}
                onSave={onSave}
                onOpenLibraryStore={onOpenLibraryStore}
                onDownloadFlow={onDownloadSnippet}
                onDuplicateFlow={onDuplicateSnippet}
                readOnly={readOnly}
                allowShortcutsInModal
            />
        </Layout.Panel>
    );
}
