import type { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import {
    NODE_CARD_WIDTH,
    NODE_TILE_SIZE,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import type { CanvasNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';

export const MINI_MAP_WIDTH = 180;
export const MINI_MAP_HEIGHT = 120;
export const MINI_MAP_PADDING = 10;
export const WORLD_PADDING = 160;
export const MINI_MAP_NODE_SIZE = 7;

const DEFAULT_NODE_HEIGHT = 120;
const MINI_MAP_EDGE_HANDLE_OFFSET = 10;
const MINI_MAP_EDGE_CORNER_RADIUS = 2.5;

type MonacoInstance = Parameters<OnMount>[1];

export const toDecorations = (
    monaco: MonacoInstance,
    lines: number[],
    state: 'passed' | 'active' | 'error',
): editor.IModelDeltaDecoration[] => lines.map(line => ({
    range: new monaco.Range(line, 1, line, 1),
    options: {
        isWholeLine: true,
        className: `nop-run-line-${state}`,
        linesDecorationsClassName: `nop-run-line-${state}-gutter`,
    },
}));

const countChars = (value: string, chars: string) =>
    [...value].filter(char => chars.includes(char)).length;

const isExpandableStatementStart = (line: string) => {
    if (/^(if|for|while|switch|try|else\b|catch\b|finally\b)\b/.test(line)) return false;

    return /^(await|return|const|let|var|throw)\b/.test(line)
        || /^[\w$.[\]'"]+\s*(?:=|\+=|-=|\*=|\/=|\?\?=|\|\|=|&&=)/.test(line)
        || /^(?:await\s+)?[\w$.[\]'"]+\s*\(/.test(line);
};

export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export interface MiniMapProjection {
    scale: number;
    toMiniX: (x: number) => number;
    toMiniY: (y: number) => number;
    toWorldX: (x: number) => number;
    toWorldY: (y: number) => number;
}

export const nodeBounds = (node: CanvasNode): Bounds => {
    if (node.kind === 'stickyNote') {
        const width = node.stickyNote?.width ?? 260;
        const height = node.stickyNote?.height ?? 180;

        return {
            minX: node.x - width / 2,
            minY: node.y - height / 2,
            maxX: node.x + width / 2,
            maxY: node.y + height / 2,
        };
    }

    return {
        minX: node.x - NODE_CARD_WIDTH / 2,
        minY: node.y - NODE_TILE_SIZE / 2,
        maxX: node.x + NODE_CARD_WIDTH / 2,
        maxY: node.y + DEFAULT_NODE_HEIGHT,
    };
};

export const mergeBounds = (items: Bounds[]): Bounds => ({
    minX: Math.min(...items.map(item => item.minX)),
    minY: Math.min(...items.map(item => item.minY)),
    maxX: Math.max(...items.map(item => item.maxX)),
    maxY: Math.max(...items.map(item => item.maxY)),
});

export const getMiniMapNodeCenter = (
    node: CanvasNode,
    projection: Pick<MiniMapProjection, 'toMiniX' | 'toMiniY'>,
) => {
    const bounds = nodeBounds(node);

    return {
        x: projection.toMiniX((bounds.minX + bounds.maxX) / 2),
        y: projection.toMiniY((bounds.minY + bounds.maxY) / 2),
    };
};

export const getMiniMapEdgePath = (
    start: { x: number; y: number },
    end: { x: number; y: number },
) => {
    if (end.x < start.x) {
        const exitX = start.x + MINI_MAP_EDGE_HANDLE_OFFSET;
        const entryX = end.x - MINI_MAP_EDGE_HANDLE_OFFSET;
        const midY = (start.y + end.y) / 2;
        const verticalDirection = end.y >= start.y ? 1 : -1;
        const radius = Math.min(
            MINI_MAP_EDGE_CORNER_RADIUS,
            Math.abs(midY - start.y) / 2,
            Math.abs(end.y - midY) / 2,
        );

        return [
            `M ${start.x} ${start.y}`,
            `L ${exitX - radius} ${start.y}`,
            `Q ${exitX} ${start.y} ${exitX} ${start.y + verticalDirection * radius}`,
            `L ${exitX} ${midY - verticalDirection * radius}`,
            `Q ${exitX} ${midY} ${exitX - radius} ${midY}`,
            `L ${entryX + radius} ${midY}`,
            `Q ${entryX} ${midY} ${entryX} ${midY + verticalDirection * radius}`,
            `L ${entryX} ${end.y - verticalDirection * radius}`,
            `Q ${entryX} ${end.y} ${entryX + radius} ${end.y}`,
            `L ${end.x} ${end.y}`,
        ].join(' ');
    }

    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
};

export const getExpandedStatementLines = (code: string, lines: number[]): number[] => {
    const sourceLines = code.split('\n');
    const expanded = new Set(lines);

    lines.forEach(lineNumber => {
        const firstLine = sourceLines[lineNumber - 1]?.trim() ?? '';
        if (!isExpandableStatementStart(firstLine) || /;\s*$/.test(firstLine)) return;

        let depth = 0;
        for (let index = lineNumber - 1; index < sourceLines.length; index += 1) {
            const current = sourceLines[index];
            expanded.add(index + 1);
            depth += countChars(current, '({[');
            depth -= countChars(current, ')}]');

            if (index > lineNumber - 1 && depth <= 0 && /(?:;|\)|\]|\})\s*[,;]?$/.test(current.trim())) {
                break;
            }
        }
    });

    return Array.from(expanded);
};
