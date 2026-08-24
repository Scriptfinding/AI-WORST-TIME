import { CodeEditor } from '@/Shared/CodeEditor/components/CodeEditor';
import * as S from './styled';
import type { CodeSnapshotEditorProps } from './types';
import { useCodeSnapshotEditor } from './useCodeSnapshotEditor';

const editorOptions = {
    readOnly: true,
    domReadOnly: true,
    minimap: { enabled: false },
    fontSize: 12,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    glyphMargin: true,
    lineNumbers: 'on' as const,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'off' as const,
    padding: { top: 8 },
    renderLineHighlight: 'none' as const,
    contextmenu: false,
    wordBasedSuggestions: 'off' as const,
    suggest: {
        showFiles: false,
        showWords: false,
    },
};

export default function CodeSnapshotEditor(props: CodeSnapshotEditorProps) {
    const { displayCode, handleMount } = useCodeSnapshotEditor(props);

    return (
        <S.Wrapper $flatBottom={props.flatBottom}>
            <CodeEditor
                gizmos
                selectorGizmos={false}
                height="100%"
                language="javascript"
                theme={props.resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                value={displayCode}
                onMount={handleMount}
                options={editorOptions}
            />
        </S.Wrapper>
    );
}
