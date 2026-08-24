import type React from 'react';
import { useRef } from 'react';
import type { StickyNoteColor } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import * as S from './styled';

const RESIZE_DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;
const MIN_NOTE_WIDTH = 180;
const MIN_NOTE_HEIGHT = 120;

type ResizeDirection = typeof RESIZE_DIRECTIONS[number];
type ResizeUpdate = { width: number; height: number; x: number; y: number };

interface StickyNoteResizeHandlesProps {
    color: StickyNoteColor;
    height: number;
    nodeX: number;
    nodeY: number;
    viewportZoom: number;
    width: number;
    onResize: (changes: ResizeUpdate) => void;
}

export default function StickyNoteResizeHandles({
    color,
    height,
    nodeX,
    nodeY,
    viewportZoom,
    width,
    onResize,
}: StickyNoteResizeHandlesProps) {
    const resizeRef = useRef<{
        pointerId: number;
        startX: number;
        startY: number;
        left: number;
        right: number;
        top: number;
        bottom: number;
        direction: ResizeDirection;
    } | null>(null);

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>, direction: ResizeDirection) => {
        if (event.button !== 0) return;

        event.preventDefault();
        event.stopPropagation();
        resizeRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            left: nodeX - width / 2,
            right: nodeX + width / 2,
            top: nodeY - height / 2,
            bottom: nodeY + height / 2,
            direction,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const resize = resizeRef.current;
        if (!resize || resize.pointerId !== event.pointerId) return;

        const dx = (event.clientX - resize.startX) / viewportZoom;
        const dy = (event.clientY - resize.startY) / viewportZoom;
        let nextLeft = resize.left;
        let nextRight = resize.right;
        let nextTop = resize.top;
        let nextBottom = resize.bottom;

        if (resize.direction.includes('e')) nextRight = Math.max(resize.left + MIN_NOTE_WIDTH, resize.right + dx);
        if (resize.direction.includes('w')) nextLeft = Math.min(resize.right - MIN_NOTE_WIDTH, resize.left + dx);
        if (resize.direction.includes('s')) nextBottom = Math.max(resize.top + MIN_NOTE_HEIGHT, resize.bottom + dy);
        if (resize.direction.includes('n')) nextTop = Math.min(resize.bottom - MIN_NOTE_HEIGHT, resize.top + dy);

        const nextWidth = nextRight - nextLeft;
        const nextHeight = nextBottom - nextTop;
        onResize({
            width: nextWidth,
            height: nextHeight,
            x: nextLeft + nextWidth / 2,
            y: nextTop + nextHeight / 2,
        });
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (resizeRef.current?.pointerId !== event.pointerId) return;

        resizeRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    return RESIZE_DIRECTIONS.map(direction => (
        <S.StickyNoteResizeHandle
            key={direction}
            $color={color}
            $direction={direction}
            onPointerDown={event => handlePointerDown(event, direction)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        />
    ));
}
