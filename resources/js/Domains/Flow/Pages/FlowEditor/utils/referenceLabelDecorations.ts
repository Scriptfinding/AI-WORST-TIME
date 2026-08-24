import type { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { fetchAiModelSuggestions } from '@/Domains/AiModel/aiModelSuggestions';
import { fetchChannelSuggestions } from './channelSuggestions';
import { fetchMailboxWatcherSuggestions } from './mailboxWatcherSuggestions';
import { fetchSnippetSuggestions, invalidateSnippetCache } from './snippetSuggestions';
import { fetchVariableSuggestions } from './variableSuggestions';

type Monaco = Parameters<OnMount>[1];

const UPDATE_DEBOUNCE_MS = 150;

const decoratedEditors = new WeakSet<editor.IStandaloneCodeEditor>();
const labelRefreshers = new Set<(force: boolean) => Promise<void>>();

export function refreshReferenceLabelDecorations(force = true) {
    for (const refresh of labelRefreshers) void refresh(force);
}

async function buildLabelMap(flowId: Id | null, force: boolean): Promise<Map<string, string>> {
    if (force) invalidateSnippetCache();
    const results = await Promise.allSettled([
        fetchVariableSuggestions(force),
        fetchChannelSuggestions(force),
        fetchAiModelSuggestions(force),
        fetchSnippetSuggestions(),
        flowId ? fetchMailboxWatcherSuggestions(flowId, force) : Promise.resolve([]),
    ] as const);

    const map = new Map<string, string>();
    const [variables, channels, aiModels, snippets, watchers] = results;

    if (variables.status === 'fulfilled') {
        for (const variable of variables.value) {
            if (variable.type !== 'json_path') map.set(String(variable.id), variable.key);
        }
    }
    if (channels.status === 'fulfilled') {
        for (const channel of channels.value) map.set(String(channel.id), channel.name);
    }
    if (aiModels.status === 'fulfilled') {
        for (const model of aiModels.value) map.set(String(model.id), model.name);
    }
    if (snippets.status === 'fulfilled') {
        for (const snippet of snippets.value) map.set(String(snippet.id), snippet.label);
    }
    if (watchers.status === 'fulfilled') {
        for (const watcher of watchers.value) map.set(String(watcher.id), watcher.name);
    }

    return map;
}

interface RegisterOptions {
    flowId?: Id | null;
}

export function registerReferenceLabelDecorations(
    currentEditor: editor.IStandaloneCodeEditor,
    monaco: Monaco,
    options: RegisterOptions = {},
): { dispose: () => void } {
    if (!monaco || decoratedEditors.has(currentEditor)) return { dispose: () => {} };
    decoratedEditors.add(currentEditor);

    const flowId = options.flowId ?? null;
    const collection = currentEditor.createDecorationsCollection();
    let labels = new Map<string, string>();
    let disposed = false;
    let updateTimer: ReturnType<typeof setTimeout> | null = null;

    const applyDecorations = () => {
        if (disposed) return;
        const model = currentEditor.getModel();
        if (!model) {
            collection.clear();
            return;
        }

        const decorations: editor.IModelDeltaDecoration[] = [];
        const source = model.getValue();
        for (const [id, label] of labels) {
            let startOffset = source.indexOf(id);
            while (startOffset !== -1) {
                const previous = source[startOffset - 1] ?? '';
                const next = source[startOffset + id.length] ?? '';
                if (/[A-Za-z0-9_-]/.test(previous) || /[A-Za-z0-9_-]/.test(next)) {
                    startOffset = source.indexOf(id, startOffset + id.length);
                    continue;
                }

                const start = model.getPositionAt(startOffset);
                const end = model.getPositionAt(startOffset + id.length);
                decorations.push({
                    range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
                    options: {
                        inlineClassName: 'pf-ref-id',
                        after: {
                            content: `\u00A0${label}\u00A0`,
                            inlineClassName: 'pf-ref-label',
                            cursorStops: monaco.editor.InjectedTextCursorStops.None,
                        },
                    },
                });
                startOffset = source.indexOf(id, startOffset + id.length);
            }
        }

        collection.set(decorations);
    };

    const refreshLabels = async (force: boolean) => {
        const map = await buildLabelMap(flowId, force);
        if (disposed) return;
        labels = map;
        applyDecorations();
    };
    labelRefreshers.add(refreshLabels);

    const scheduleUpdate = () => {
        if (updateTimer) clearTimeout(updateTimer);
        // Going through the fetchers keeps labels in sync after quick-creates
        // or renames (they answer from cache unless it was invalidated).
        updateTimer = setTimeout(() => void refreshLabels(false), UPDATE_DEBOUNCE_MS);
    };

    void refreshLabels(false);
    const changeDisposable = currentEditor.onDidChangeModelContent(scheduleUpdate);
    const modelDisposable = currentEditor.onDidChangeModel(scheduleUpdate);

    const dispose = () => {
        if (disposed) return;
        disposed = true;
        decoratedEditors.delete(currentEditor);
        if (updateTimer) clearTimeout(updateTimer);
        changeDisposable.dispose();
        modelDisposable.dispose();
        labelRefreshers.delete(refreshLabels);
        collection.clear();
    };

    currentEditor.onDidDispose(dispose);

    return { dispose };
}
