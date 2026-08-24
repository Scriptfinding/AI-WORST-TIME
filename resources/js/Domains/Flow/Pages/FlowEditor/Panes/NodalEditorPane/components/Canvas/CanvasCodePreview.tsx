import { CodeEditor } from '@/Shared/CodeEditor/components/CodeEditor';
import * as S from './CanvasCodePreview.styled';
import { useCanvasCodePreviewEditor } from './hooks/useCanvasCodePreviewEditor';

interface CanvasCodePreviewProps {
    generatedCode: string;
    resolvedTheme: string;
    readOnly?: boolean;
    codeSnapshot?: string | null;
    activeLine?: number | null;
    passedLines?: Set<number> | number[];
    errorLine?: number | null;
}

export default function CanvasCodePreview(props: CanvasCodePreviewProps) {
    const { displayCode, handleCodeMount } = useCanvasCodePreviewEditor(props);
    const readOnly = props.readOnly ?? true;

    return (
        <S.NodalCodePreview $readOnly={readOnly}>
            <CodeEditor
                gizmos
                height="100%"
                language="javascript"
                theme={props.resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                value={displayCode}
                onMount={handleCodeMount}
                options={{
                    readOnly: true,
                    domReadOnly: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    glyphMargin: true,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    padding: { top: 10, bottom: 10 },
                    renderLineHighlight: 'none',
                    contextmenu: false,
                    wordBasedSuggestions: 'off',
                    suggest: {
                        showFiles: false,
                        showWords: false,
                    },
                }}
            />
        </S.NodalCodePreview>
    );
}
