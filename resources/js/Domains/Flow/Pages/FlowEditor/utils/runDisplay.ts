import React from 'react';
import type { FlowRun } from '@/Domains/Flow/types';

export const JSON_VIEWER_OPTIONS = {
    readOnly: true,
    minimap: { enabled: false },
    fontSize: 11,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineNumbers: 'off' as const,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    folding: true,
    wordWrap: 'off' as const,
    padding: { top: 6, bottom: 6 },
    renderLineHighlight: 'none' as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    scrollbar: { vertical: 'auto' as const, horizontal: 'hidden' as const },
    domReadOnly: true,
    contextmenu: false,
    guides: { indentation: false },
    wordBasedSuggestions: 'off' as const,
    suggest: {
        showFiles: false,
        showWords: false,
    },
};

export const formatJson = (data: Record<string, unknown> | null): string => {
    if (!data) return '';
    return JSON.stringify(data, null, 2).replace(/\\n/g, '\n');
};

export const getRunMeta = (run: FlowRun): Record<string, unknown> | null => {
    const output = run.output as { $context?: { meta?: unknown } } | null;
    const meta = run.meta ?? output?.$context?.meta;
    if (meta && typeof meta === 'object' && !Array.isArray(meta) && Object.keys(meta).length > 0) {
        return meta as Record<string, unknown>;
    }
    return null;
};

export function renderInlineMarkdown(text: string): React.ReactNode[] {
    const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*/g;
    const tokens: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            tokens.push(text.slice(lastIndex, match.index));
        }
        if (match[1] != null) {
            tokens.push(React.createElement('a', { key: key++, href: match[2], target: '_blank', rel: 'noopener noreferrer' }, match[1]));
        } else if (match[3] != null) {
            tokens.push(React.createElement('strong', { key: key++ }, match[3]));
        } else if (match[4] != null) {
            tokens.push(React.createElement('u', { key: key++ }, match[4]));
        } else if (match[5] != null) {
            tokens.push(React.createElement('em', { key: key++ }, match[5]));
        }
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        tokens.push(text.slice(lastIndex));
    }
    return tokens;
}
