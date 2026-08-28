import type { ConsoleLogEntry } from '@/Domains/Flow/types';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';

export const RUN_EVENT_PREFIX = '__NOP_RUN_EVENT__';
const RUN_NODE_MARKER_RE = /^\s*__nopRunNode(?:Start|End)\(".*"\);\s*$/;
const RUN_EDGE_MARKER_RE = /^\s*__nopRunEdge\(".*"\);\s*$/;
const getLineMarkerValue = (line: string): number | null => {
    const match = line.match(/__nopRunLine\((\d+)\);/);
    return match ? Number(match[1]) : null;
};

type RunProgressEvent =
    | { kind: 'line'; line: number; phase: 'start' | 'end'; offset_ms?: number }
    | { kind: 'node'; nodeId: string; phase: 'start' | 'end'; offset_ms?: number }
    | { kind: 'edge'; edgeId: string; offset_ms?: number };

export interface RunProgressState {
    activeLine: number | null;
    passedLines: Set<number>;
    linePassCounts: Map<number, number>;
    activeNodeId: string | null;
    passedNodeIds: Set<string>;
    nodePassCounts: Map<string, number>;
    passedEdgeIds: Set<string>;
    edgePassCounts: Map<string, number>;
}

interface DisplayCodeSnapshot {
    code: string;
    lineMap: Map<number, number>;
}

const parseRunProgressEvent = (message: string): RunProgressEvent | null => {
    if (!message.startsWith(RUN_EVENT_PREFIX)) return null;

    try {
        const parsed = JSON.parse(message.slice(RUN_EVENT_PREFIX.length)) as Partial<RunProgressEvent>;
        if (parsed.kind === 'line' && typeof parsed.line === 'number') {
            return {
                kind: 'line',
                line: parsed.line,
                phase: parsed.phase === 'end' ? 'end' : 'start',
                offset_ms: parsed.offset_ms,
            };
        }
        if (parsed.kind === 'node' && typeof parsed.nodeId === 'string') {
            return {
                kind: 'node',
                nodeId: parsed.nodeId,
                phase: parsed.phase === 'end' ? 'end' : 'start',
                offset_ms: parsed.offset_ms,
            };
        }
        if (parsed.kind === 'edge' && typeof parsed.edgeId === 'string') {
            return { kind: 'edge', edgeId: parsed.edgeId, offset_ms: parsed.offset_ms };
        }
    } catch {}

    return null;
};

const normalizeConsoleLog = (log: unknown): ConsoleLogEntry | null => {
    if (typeof log === 'string') {
        return { level: 'error', message: log, ts: '' };
    }
    if (!log || typeof log !== 'object') return null;

    const entry = log as Partial<ConsoleLogEntry>;
    if (typeof entry.message !== 'string') return null;

    const level = ['info', 'warn', 'error', 'debug'].includes(entry.level ?? '')
        ? entry.level!
        : 'info';

    return {
        level,
        message: entry.message,
        ts: typeof entry.ts === 'string' ? entry.ts : '',
    };
};

export const isRunProgressLog = (log: ConsoleLogEntry) =>
    log.message.startsWith(RUN_EVENT_PREFIX);

export const getVisibleConsoleLogs = (logs: ConsoleLogEntry[] | null | undefined): ConsoleLogEntry[] => {
    return (logs ?? [])
        .map(normalizeConsoleLog)
        .filter((log): log is ConsoleLogEntry => log !== null && !isRunProgressLog(log));
};

export const getRunProgressState = (logs: ConsoleLogEntry[] | null | undefined): RunProgressState => {
    const passedLines = new Set<number>();
    const linePassCounts = new Map<number, number>();
    const passedNodeIds = new Set<string>();
    const nodePassCounts = new Map<string, number>();
    const passedEdgeIds = new Set<string>();
    const edgePassCounts = new Map<string, number>();
    let activeLine: number | null = null;
    let activeNodeId: string | null = null;

    for (const rawLog of logs ?? []) {
        const log = normalizeConsoleLog(rawLog);
        if (!log) continue;
        const event = parseRunProgressEvent(log.message);
        if (!event) continue;

        if (event.kind === 'line') {
            linePassCounts.set(event.line, (linePassCounts.get(event.line) ?? 0) + 1);
            if (activeLine != null && activeLine !== event.line) {
                passedLines.add(activeLine);
            }
            activeLine = event.line;
        } else if (event.kind === 'node') {
            if (event.phase === 'end') {
                passedNodeIds.add(event.nodeId);
                if (activeNodeId === event.nodeId) {
                    activeNodeId = null;
                }
            } else {
                nodePassCounts.set(event.nodeId, (nodePassCounts.get(event.nodeId) ?? 0) + 1);
                if (activeNodeId && activeNodeId !== event.nodeId) {
                    passedNodeIds.add(activeNodeId);
                }
                activeNodeId = event.nodeId;
                passedNodeIds.delete(event.nodeId);
            }
        } else if (event.kind === 'edge') {
            passedEdgeIds.add(event.edgeId);
            edgePassCounts.set(event.edgeId, (edgePassCounts.get(event.edgeId) ?? 0) + 1);
        }
    }

    return {
        activeLine,
        passedLines,
        linePassCounts,
        activeNodeId,
        passedNodeIds,
        nodePassCounts,
        passedEdgeIds,
        edgePassCounts,
    };
};

export const extractNodalGraphSnapshot = (codeSnapshot: string | null | undefined): NodalGraph | null => {
    if (!codeSnapshot?.includes('// Nodal graph snapshot:')) return null;

    const graphLines: string[] = [];
    let collecting = false;

    for (const line of codeSnapshot.split('\n')) {
        if (line === '// Nodal graph snapshot:') {
            collecting = true;
            continue;
        }

        if (!collecting) continue;
        if (line.trim() === '') break;
        if (!line.startsWith('// ')) break;
        graphLines.push(line.slice(3));
    }

    if (graphLines.length === 0) return null;

    try {
        const parsed = JSON.parse(graphLines.join('\n')) as NodalGraph;
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
            return parsed;
        }
    } catch {}

    return null;
};

export const getDisplayCodeSnapshot = (codeSnapshot: string | null | undefined): string => {
    return getDisplayCodeSnapshotWithLineMap(codeSnapshot).code;
};

export const getDisplayCodeSnapshotWithLineMap = (codeSnapshot: string | null | undefined): DisplayCodeSnapshot => {
    const visibleLines: string[] = [];
    const lineMap = new Map<number, number>();
    const pendingHiddenMarkerLines: number[] = [];

    (codeSnapshot ?? '').split('\n').forEach((line, index) => {
        const originalLine = index + 1;
        const markerLine = getLineMarkerValue(line);
        if (markerLine != null) {
            pendingHiddenMarkerLines.push(markerLine);
            return;
        }
        if (RUN_NODE_MARKER_RE.test(line) || RUN_EDGE_MARKER_RE.test(line)) return;

        visibleLines.push(line);
        lineMap.set(originalLine, visibleLines.length);
        pendingHiddenMarkerLines.splice(0).forEach(markerLine => {
            lineMap.set(markerLine, visibleLines.length);
        });
    });

    return { code: visibleLines.join('\n'), lineMap };
};

const getNodeIdFromMarker = (line: string, marker: 'Start' | 'End'): string | null => {
    const match = line.match(new RegExp(`__nopRunNode${marker}\\("((?:\\\\.|[^"\\\\])*)"\\);`));
    if (!match) return null;
    try {
        return JSON.parse(`"${match[1]}"`) as string;
    } catch {
        return match[1] ?? null;
    }
};

export const getVisualRunProgressState = (
    codeSnapshot: string | null | undefined,
    progress: RunProgressState,
): Pick<RunProgressState, 'activeNodeId' | 'passedNodeIds' | 'nodePassCounts' | 'passedEdgeIds' | 'edgePassCounts'> => {
    if (progress.activeNodeId || progress.passedNodeIds.size > 0 || progress.passedEdgeIds.size > 0) {
        return {
            activeNodeId: progress.activeNodeId,
            passedNodeIds: progress.passedNodeIds,
            nodePassCounts: progress.nodePassCounts,
            passedEdgeIds: progress.passedEdgeIds,
            edgePassCounts: progress.edgePassCounts,
        };
    }

    const lineToNodeId = new Map<number, string>();
    const nodeStack: string[] = [];
    let pendingMarkerLine: number | null = null;

    (codeSnapshot ?? '').split('\n').forEach((line, index) => {
        const sourceLine = index + 1;
        const lineMarker = getLineMarkerValue(line);
        if (lineMarker != null) {
            pendingMarkerLine = lineMarker;
            return;
        }

        const startedNodeId = getNodeIdFromMarker(line, 'Start');
        if (startedNodeId) {
            nodeStack.push(startedNodeId);
            if (pendingMarkerLine != null) {
                lineToNodeId.set(pendingMarkerLine, startedNodeId);
                pendingMarkerLine = null;
            }
            return;
        }

        const endedNodeId = getNodeIdFromMarker(line, 'End');
        if (endedNodeId) {
            const lastIndex = nodeStack.lastIndexOf(endedNodeId);
            if (lastIndex >= 0) nodeStack.splice(lastIndex, 1);
            return;
        }
        if (RUN_EDGE_MARKER_RE.test(line)) return;

        const currentNodeId = nodeStack[nodeStack.length - 1];
        if (currentNodeId) {
            if (pendingMarkerLine != null) {
                lineToNodeId.set(pendingMarkerLine, currentNodeId);
                pendingMarkerLine = null;
            }
            lineToNodeId.set(sourceLine, currentNodeId);
        }
    });

    const passedNodeIds = new Set<string>();
    const nodePassCounts = new Map<string, number>();
    progress.passedLines.forEach(line => {
        const nodeId = lineToNodeId.get(line);
        if (nodeId) passedNodeIds.add(nodeId);
    });
    progress.linePassCounts.forEach((count, line) => {
        const nodeId = lineToNodeId.get(line);
        if (nodeId) nodePassCounts.set(nodeId, (nodePassCounts.get(nodeId) ?? 0) + count);
    });

    const activeNodeId = progress.activeLine ? lineToNodeId.get(progress.activeLine) ?? null : null;
    if (activeNodeId) passedNodeIds.delete(activeNodeId);

    return {
        activeNodeId,
        passedNodeIds,
        nodePassCounts,
        passedEdgeIds: new Set(),
        edgePassCounts: new Map(),
    };
};

