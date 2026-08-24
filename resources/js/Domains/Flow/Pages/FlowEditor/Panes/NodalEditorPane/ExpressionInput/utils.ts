import type { CSSProperties } from 'react';
import type { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { AnchoredDropdownRect } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/hooks/useAnchoredDropdownPosition';
import { expressionForPath } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/expression';

export const EXPRESSION_LINE_HEIGHT = 18;
export const EXPRESSION_VERTICAL_PADDING = 16;
export const EXPRESSION_MIN_HEIGHT = EXPRESSION_LINE_HEIGHT + EXPRESSION_VERTICAL_PADDING;
export const EXPRESSION_MAX_HEIGHT = EXPRESSION_LINE_HEIGHT * 7 + EXPRESSION_VERTICAL_PADDING;
export const DEFAULT_SELECT_SEARCH_THRESHOLD = 10;

export const EXPRESSION_EDITOR_OPTIONS = {
    minimap: { enabled: false },
    fontSize: 12,
    lineHeight: EXPRESSION_LINE_HEIGHT,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineNumbers: 'off' as const,
    glyphMargin: false,
    folding: false,
    lineDecorationsWidth: 10,
    lineNumbersMinChars: 0,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on' as const,
    padding: { top: 8, bottom: 8 },
    renderLineHighlight: 'none' as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    scrollbar: {
        vertical: 'hidden' as const,
        horizontal: 'hidden' as const,
        handleMouseWheel: false,
    },
    fixedOverflowWidgets: true,
    contextmenu: false,
    guides: { indentation: false },
    bracketPairColorization: { enabled: true },
    wordBasedSuggestions: 'off' as const,
    suggest: {
        showFiles: false,
        showWords: false,
    },
};

export const EXPRESSION_FULLSCREEN_EDITOR_OPTIONS = {
    ...EXPRESSION_EDITOR_OPTIONS,
    fontSize: 13,
    padding: { top: 14, bottom: 14 },
    scrollbar: {
        vertical: 'auto' as const,
        horizontal: 'auto' as const,
        handleMouseWheel: true,
    },
};

// Overrides applied when a fixed input hosts real code (valueType 'code'),
// turning the bare expression field into a small code editor.
export const CODE_INPUT_EDITOR_OPTIONS = {
    lineNumbers: 'on' as const,
    lineNumbersMinChars: 3,
    folding: true,
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
    parameterHints: { enabled: true },
    hover: { enabled: true },
    scrollbar: {
        vertical: 'auto' as const,
        horizontal: 'auto' as const,
        handleMouseWheel: true,
    },
};

export const PLAIN_FIXED_INPUT_EDITOR_OPTIONS = {
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    parameterHints: { enabled: false },
    hover: { enabled: false },
};

const TEMPLATE_PATTERN = /\{\{[\s\S]*?\}\}/g;
const templateDecoratedEditors = new WeakSet<editor.IStandaloneCodeEditor>();

export function insertPathExpression(current: string, path: string) {
    const expression = expressionForPath(path);
    return current.trim()
        ? `${current.trim()} ${expression}`
        : expression;
}

export function capitalizeLabel(value: string) {
    const normalized = value
        .replace(/\?$/, '')
        .replace(/^\.\.\./, '')
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .trim();

    return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : value;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

export function unresolvedResultLabel(value: unknown) {
    if (typeof value !== 'string') return null;
    const match = value.match(/^\[Needs run: ([^\]]+)\]$/);
    return match?.[1] ?? null;
}

export function hasOpenEditorAutocomplete() {
    return document.querySelector('.suggest-widget.visible, .parameter-hints-widget.visible') !== null;
}

export function dropdownStyle(rect: AnchoredDropdownRect): CSSProperties {
    return {
        position: 'fixed',
        top: rect.top,
        left: rect.left,
        right: 'auto',
        width: rect.width,
        maxHeight: rect.maxHeight,
        transform: rect.placement === 'above' ? 'translateY(-100%)' : undefined,
    };
}

export function registerTemplateDecorations(
    currentEditor: editor.IStandaloneCodeEditor,
    monaco: Parameters<OnMount>[1],
) {
    if (templateDecoratedEditors.has(currentEditor)) return;
    templateDecoratedEditors.add(currentEditor);

    const collection = currentEditor.createDecorationsCollection();
    const updateDecorations = () => {
        const model = currentEditor.getModel();
        if (!model) {
            collection.clear();
            return;
        }

        const decorations = [...model.getValue().matchAll(TEMPLATE_PATTERN)].map(match => {
            const startOffset = match.index ?? 0;
            const endOffset = startOffset + match[0].length;

            return {
                range: new monaco.Range(
                    model.getPositionAt(startOffset).lineNumber,
                    model.getPositionAt(startOffset).column,
                    model.getPositionAt(endOffset).lineNumber,
                    model.getPositionAt(endOffset).column,
                ),
                options: {
                    inlineClassName: 'nop-template-token',
                },
            };
        });

        collection.set(decorations);
    };

    updateDecorations();
    const changeDisposable = currentEditor.onDidChangeModelContent(updateDecorations);
    currentEditor.onDidDispose(() => {
        changeDisposable.dispose();
        collection.clear();
    });
}
