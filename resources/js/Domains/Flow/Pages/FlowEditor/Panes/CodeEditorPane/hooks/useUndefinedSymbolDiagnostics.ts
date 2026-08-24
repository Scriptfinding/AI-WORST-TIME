import { useCallback, useEffect, useRef } from 'react';
import type { OnMount } from '@monaco-editor/react';
import type { languages } from 'monaco-editor';

const MARKER_OWNER = 'puppetflow-undefined-symbols';
const UNDEFINED_SYMBOL_CODES = new Set([2304, 2552]);
const VALIDATION_DELAY_MS = 300;

type Monaco = Parameters<OnMount>[1];
type DiagnosticMessage = languages.typescript.Diagnostic['messageText'];

function formatDiagnosticMessage(message: DiagnosticMessage): string {
    if (typeof message === 'string') return message;

    return [
        message.messageText,
        ...(message.next ?? []).map(formatDiagnosticMessage),
    ].join(' ');
}

// Adds Flow-code-only diagnostics without enabling validation in other Monaco editors.
export function useUndefinedSymbolDiagnostics() {
    const cleanupRef = useRef<() => void>(() => {});

    const handleEditorMount: OnMount = useCallback((editorInstance, monaco: Monaco) => {
        cleanupRef.current();

        const model = editorInstance.getModel();
        if (!model) return;

        let disposed = false;
        let validationTimer: ReturnType<typeof setTimeout> | null = null;
        let validationRequest = 0;
        const decorations = editorInstance.createDecorationsCollection();

        const validate = async () => {
            const request = ++validationRequest;
            const versionId = model.getVersionId();

            try {
                const getWorker = await monaco.languages.typescript.getJavaScriptWorker();
                const worker = await getWorker(model.uri);
                const diagnostics = await worker.getSemanticDiagnostics(model.uri.toString());

                if (
                    disposed
                    || request !== validationRequest
                    || editorInstance.getModel() !== model
                    || model.getVersionId() !== versionId
                ) return;

                const undefinedSymbols = diagnostics.filter(diagnostic =>
                    UNDEFINED_SYMBOL_CODES.has(diagnostic.code)
                    && diagnostic.start != null
                    && diagnostic.length != null);
                const lineMessages = new Map<number, string[]>();

                const markers = undefinedSymbols.map(diagnostic => {
                    const start = model.getPositionAt(diagnostic.start ?? 0);
                    const end = model.getPositionAt(
                        (diagnostic.start ?? 0) + Math.max(diagnostic.length ?? 0, 1),
                    );
                    const message = formatDiagnosticMessage(diagnostic.messageText);
                    const messages = lineMessages.get(start.lineNumber) ?? [];
                    if (!messages.includes(message)) messages.push(message);
                    lineMessages.set(start.lineNumber, messages);

                    return {
                        severity: monaco.MarkerSeverity.Error,
                        message,
                        code: String(diagnostic.code),
                        source: 'JavaScript',
                        startLineNumber: start.lineNumber,
                        startColumn: start.column,
                        endLineNumber: end.lineNumber,
                        endColumn: end.column,
                    };
                });

                monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
                decorations.set([...lineMessages.entries()].map(([lineNumber, messages]) => ({
                    range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                    options: {
                        isWholeLine: true,
                        className: 'nop-undefined-symbol-line',
                        glyphMarginClassName: 'nop-undefined-symbol-glyph',
                        glyphMarginHoverMessage: messages.map(value => ({ value })),
                        glyphMargin: {
                            position: monaco.editor.GlyphMarginLane.Right,
                        },
                    },
                })));
            } catch {
                if (!disposed) {
                    monaco.editor.setModelMarkers(model, MARKER_OWNER, []);
                    decorations.clear();
                }
            }
        };

        const scheduleValidation = () => {
            if (validationTimer) clearTimeout(validationTimer);
            validationTimer = setTimeout(validate, VALIDATION_DELAY_MS);
        };

        scheduleValidation();
        const contentDisposable = model.onDidChangeContent(scheduleValidation);
        const extraLibRefreshTimer = setTimeout(scheduleValidation, 1500);

        cleanupRef.current = () => {
            disposed = true;
            validationRequest += 1;
            if (validationTimer) clearTimeout(validationTimer);
            clearTimeout(extraLibRefreshTimer);
            contentDisposable.dispose();
            monaco.editor.setModelMarkers(model, MARKER_OWNER, []);
            decorations.clear();
        };
    }, []);

    useEffect(() => () => cleanupRef.current(), []);

    return handleEditorMount;
}
