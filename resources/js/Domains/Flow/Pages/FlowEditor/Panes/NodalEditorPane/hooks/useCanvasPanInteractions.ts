import type React from 'react';
import { useCallback, useRef } from 'react';
import { clampCanvasZoom } from './useCanvasViewport';
import type { UseCanvasInteractionsOptions } from './useCanvasInteractions.types';

const PINCH_ZOOM_SENSITIVITY = 0.004;
const MAX_PINCH_WHEEL_DELTA = 24;
const ZOOM_MOMENTUM_RESET_MS = 180;
const ZOOM_MOMENTUM_DELTA_TOLERANCE = 0.5;
const ZOOM_MOMENTUM_MIN_DECAY_EVENTS = 3;
const ZOOM_MOMENTUM_MAX_DELTA = 12;

interface ZoomWheelState {
    time: number;
    absDeltaY: number;
    direction: number;
    decayingEvents: number;
    ignoringMomentum: boolean;
}

interface ViewportPanDragState {
    pointerId: number;
    startX: number;
    startY: number;
    viewportX: number;
    viewportY: number;
}

type UseCanvasPanInteractionsOptions = Pick<
    UseCanvasInteractionsOptions,
    'canvasRef' | 'onViewportPan' | 'setContextMenu' | 'setSelectionBox' | 'setViewport' | 'viewport'
>;

// Implements pointer-driven canvas panning while respecting the active tool mode.
export function useCanvasPanInteractions({
    canvasRef,
    onViewportPan,
    setContextMenu,
    setSelectionBox,
    setViewport,
    viewport,
}: UseCanvasPanInteractionsOptions) {
    const zoomWheelStateRef = useRef<ZoomWheelState | null>(null);
    const viewportPanDragRef = useRef<ViewportPanDragState | null>(null);

    const shouldIgnoreZoomMomentum = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
        const direction = Math.sign(event.deltaY);
        if (direction === 0) return true;

        const time = event.timeStamp;
        const absDeltaY = Math.abs(event.deltaY);
        const previous = zoomWheelStateRef.current;
        const startsNewGesture = !previous
            || direction !== previous.direction
            || time - previous.time > ZOOM_MOMENTUM_RESET_MS;

        if (startsNewGesture) {
            zoomWheelStateRef.current = {
                time,
                absDeltaY,
                direction,
                decayingEvents: 0,
                ignoringMomentum: false,
            };
            return false;
        }

        const isDecayingTail = absDeltaY < previous.absDeltaY - ZOOM_MOMENTUM_DELTA_TOLERANCE;
        const isRenewedGesture = previous.ignoringMomentum
            && absDeltaY > previous.absDeltaY + ZOOM_MOMENTUM_DELTA_TOLERANCE;
        const decayingEvents = isRenewedGesture
            ? 0
            : isDecayingTail
                ? previous.decayingEvents + 1
                : 0;
        const ignoringMomentum = isRenewedGesture
            ? false
            : previous.ignoringMomentum
                || (decayingEvents >= ZOOM_MOMENTUM_MIN_DECAY_EVENTS && absDeltaY <= ZOOM_MOMENTUM_MAX_DELTA);

        zoomWheelStateRef.current = {
            time,
            absDeltaY,
            direction,
            decayingEvents,
            ignoringMomentum,
        };

        return ignoringMomentum;
    }, []);

    const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
        const target = event.target instanceof HTMLElement ? event.target : null;
        const canvas = canvasRef.current;
        const modalOverlay = target?.closest('[data-modal-overlay]');
        if (target?.closest('input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"], [role="textbox"]')) return;
        if (target?.closest('[data-node-picker]') || (modalOverlay && canvas?.contains(modalOverlay))) return;

        if (!event.ctrlKey && !event.metaKey) {
            zoomWheelStateRef.current = null;
            if (!event.deltaX && !event.deltaY) return;
            const panX = event.shiftKey ? (event.deltaX || event.deltaY) : event.deltaX;
            const panY = event.shiftKey ? 0 : event.deltaY;

            setViewport(current => ({
                ...current,
                x: current.x - panX,
                y: current.y - panY,
            }));
            onViewportPan?.();
            return;
        }

        const rect = canvas?.getBoundingClientRect();
        if (!rect || shouldIgnoreZoomMomentum(event)) return;

        const wheelDelta = event.deltaY || event.deltaX;
        if (!wheelDelta) return;
        const normalizedWheelDelta = Math.max(
            -MAX_PINCH_WHEEL_DELTA,
            Math.min(MAX_PINCH_WHEEL_DELTA, wheelDelta),
        );

        setViewport(current => {
            const nextZoom = clampCanvasZoom(
                current.zoom * Math.exp(-normalizedWheelDelta * PINCH_ZOOM_SENSITIVITY),
            );
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const worldX = (mouseX - current.x) / current.zoom;
            const worldY = (mouseY - current.y) / current.zoom;

            return {
                x: mouseX - worldX * nextZoom,
                y: mouseY - worldY * nextZoom,
                zoom: nextZoom,
            };
        });
    }, [canvasRef, onViewportPan, setViewport, shouldIgnoreZoomMomentum]);

    const handlePanPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 1) return false;
        const target = event.target as HTMLElement;
        if (target.closest('button, input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"], [role="textbox"], [data-node-picker]')) return true;

        event.preventDefault();
        event.stopPropagation();
        viewportPanDragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            viewportX: viewport.x,
            viewportY: viewport.y,
        };
        setContextMenu(null);
        setSelectionBox(null);
        event.currentTarget.setPointerCapture(event.pointerId);
        return true;
    }, [setContextMenu, setSelectionBox, viewport.x, viewport.y]);

    const handlePanPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const drag = viewportPanDragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return false;

        event.preventDefault();
        setViewport(current => ({
            ...current,
            x: drag.viewportX + event.clientX - drag.startX,
            y: drag.viewportY + event.clientY - drag.startY,
        }));
        onViewportPan?.();
        return true;
    }, [onViewportPan, setViewport]);

    const handlePanPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const drag = viewportPanDragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return false;

        viewportPanDragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        return true;
    }, []);

    const handleAuxClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (event.button !== 1) return;
        event.preventDefault();
        event.stopPropagation();
    }, []);

    return {
        handleAuxClick,
        handlePanPointerDown,
        handlePanPointerMove,
        handlePanPointerUp,
        handleWheel,
    };
}
