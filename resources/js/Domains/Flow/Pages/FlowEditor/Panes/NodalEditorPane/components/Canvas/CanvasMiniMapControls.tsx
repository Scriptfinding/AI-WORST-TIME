import { useCallback, useState } from 'react';
import type React from 'react';
import {
    MINI_MAP_HEIGHT,
    MINI_MAP_WIDTH,
} from './utils';
import * as S from './CanvasMiniMapControls.styled';

interface CanvasMiniMapControlsProps {
    children: React.ReactNode;
    fading?: boolean;
    onNavigate: (x: number, y: number) => void;
}

export default function CanvasMiniMapControls({
    children,
    fading,
    onNavigate,
}: CanvasMiniMapControlsProps) {
    const [dragPointerId, setDragPointerId] = useState<number | null>(null);

    const navigateToPointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(MINI_MAP_WIDTH, event.clientX - rect.left));
        const y = Math.max(0, Math.min(MINI_MAP_HEIGHT, event.clientY - rect.top));
        onNavigate(x, y);
    }, [onNavigate]);

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;

        event.preventDefault();
        event.stopPropagation();
        setDragPointerId(event.pointerId);
        event.currentTarget.setPointerCapture(event.pointerId);
        navigateToPointer(event);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragPointerId !== event.pointerId) return;

        event.preventDefault();
        event.stopPropagation();
        navigateToPointer(event);
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragPointerId !== event.pointerId) return;

        event.preventDefault();
        event.stopPropagation();
        setDragPointerId(null);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    return (
        <S.Controls
            role="button"
            aria-label="Move canvas viewport"
            tabIndex={0}
            $fading={fading}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {children}
        </S.Controls>
    );
}
