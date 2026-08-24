import type {
    CanvasNode,
    SelectionBox,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import {
    NODE_CARD_WIDTH,
    NODE_TILE_SIZE,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';

const DEFAULT_STICKY_NOTE_WIDTH = 260;
const DEFAULT_STICKY_NOTE_HEIGHT = 180;

const isNodeFullyInsideSelection = (node: CanvasNode, selectionBox: SelectionBox) => {
    const left = Math.min(selectionBox.startX, selectionBox.currentX);
    const right = Math.max(selectionBox.startX, selectionBox.currentX);
    const top = Math.min(selectionBox.startY, selectionBox.currentY);
    const bottom = Math.max(selectionBox.startY, selectionBox.currentY);
    const width = node.kind === 'stickyNote'
        ? node.stickyNote?.width ?? DEFAULT_STICKY_NOTE_WIDTH
        : NODE_CARD_WIDTH;
    const height = node.kind === 'stickyNote'
        ? node.stickyNote?.height ?? DEFAULT_STICKY_NOTE_HEIGHT
        : NODE_TILE_SIZE;

    return node.x - width / 2 >= left
        && node.x + width / 2 <= right
        && node.y - height / 2 >= top
        && node.y + height / 2 <= bottom;
};

export const getMarqueeSelectedNodeIds = (nodes: CanvasNode[], selectionBox: SelectionBox) => {
    const containedNodes = nodes.filter(node => isNodeFullyInsideSelection(node, selectionBox));
    const containsSelectableNode = containedNodes.some(node => node.kind !== 'stickyNote');

    return new Set(containedNodes
        .filter(node => node.kind !== 'stickyNote' || containsSelectableNode)
        .map(node => node.id));
};
