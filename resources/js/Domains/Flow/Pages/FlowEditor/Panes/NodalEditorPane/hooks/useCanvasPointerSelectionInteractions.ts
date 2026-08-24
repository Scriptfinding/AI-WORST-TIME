import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import {
    DEFAULT_INPUT_PORT,
    DEFAULT_OUTPUT_PORT,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import {
    getEdgePolyline,
    getPointDistance,
    getPortPosition,
    polylinesIntersect,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/geometry';
import { getMarqueeSelectedNodeIds } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/selection';
import type { Point } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { UseCanvasInteractionsOptions } from './useCanvasInteractions.types';

const MIN_KNIFE_POINT_DISTANCE = 4;
const KNIFE_HIT_TOLERANCE = 6;

type UseCanvasPointerSelectionOptions = Pick<
    UseCanvasInteractionsOptions,
    | 'canvasMode'
    | 'canvasRef'
    | 'edges'
    | 'getWorldPointFromClient'
    | 'knifeDragRef'
    | 'nodes'
    | 'readOnly'
    | 'recordHistory'
    | 'selectionPointerRef'
    | 'setContextMenu'
    | 'setEdgeDropTarget'
    | 'setEdges'
    | 'setKnifeDrag'
    | 'setPendingConnectionTarget'
    | 'setPendingEdgeInsertion'
    | 'setPickerOpen'
    | 'setSelectedNodeIds'
    | 'setSelectionBox'
    | 'viewport'
>;

// Handles click, marquee, and modifier-key selection on the canvas.
export function useCanvasPointerSelectionInteractions({
    canvasMode,
    canvasRef,
    edges,
    getWorldPointFromClient,
    knifeDragRef,
    nodes,
    readOnly,
    recordHistory,
    selectionPointerRef,
    setContextMenu,
    setEdgeDropTarget,
    setEdges,
    setKnifeDrag,
    setPendingConnectionTarget,
    setPendingEdgeInsertion,
    setPickerOpen,
    setSelectedNodeIds,
    setSelectionBox,
    viewport,
}: UseCanvasPointerSelectionOptions) {
    const cutModeKeyPressedRef = useRef(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() !== 'c' || event.metaKey || event.ctrlKey || event.altKey) return;
            cutModeKeyPressedRef.current = true;
        };
        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() === 'c') cutModeKeyPressedRef.current = false;
        };
        const handleBlur = () => {
            cutModeKeyPressedRef.current = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    const handleSelectionPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        if ((event.target as HTMLElement).closest('button, input, [data-node-card]')) return;

        setContextMenu(null);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const worldX = (event.clientX - rect.left - viewport.x) / viewport.zoom;
        const worldY = (event.clientY - rect.top - viewport.y) / viewport.zoom;
        const startPoint = { x: worldX, y: worldY };

        if (cutModeKeyPressedRef.current && !event.metaKey && !event.ctrlKey && !event.altKey && !readOnly && canvasMode === 'canvas') {
            const nextKnifeDrag = {
                pointerId: event.pointerId,
                points: [startPoint],
            };

            knifeDragRef.current = nextKnifeDrag;
            setKnifeDrag(nextKnifeDrag);
            setSelectionBox(null);
            setEdgeDropTarget(null);
            setPendingConnectionTarget(null);
            setPendingEdgeInsertion(null);
            setPickerOpen(false);
            event.currentTarget.setPointerCapture(event.pointerId);
            return;
        }

        selectionPointerRef.current = event.pointerId;
        setEdgeDropTarget(null);
        setSelectionBox({
            startX: worldX,
            startY: worldY,
            currentX: worldX,
            currentY: worldY,
        });
        setSelectedNodeIds(new Set());
        event.currentTarget.setPointerCapture(event.pointerId);
    }, [canvasMode, canvasRef, knifeDragRef, readOnly, selectionPointerRef, setContextMenu, setEdgeDropTarget, setKnifeDrag, setPendingConnectionTarget, setPendingEdgeInsertion, setPickerOpen, setSelectedNodeIds, setSelectionBox, viewport]);

    const handleKnifePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>, pointerWorld: Point | null) => {
        const knifeDragState = knifeDragRef.current;
        if (!knifeDragState || knifeDragState.pointerId !== event.pointerId) return false;
        if (!pointerWorld) return true;

        const previousPoint = knifeDragState.points[knifeDragState.points.length - 1];
        if (previousPoint && getPointDistance(previousPoint, pointerWorld) < MIN_KNIFE_POINT_DISTANCE / viewport.zoom) return true;

        const nextDrag = {
            ...knifeDragState,
            points: [...knifeDragState.points, pointerWorld],
        };
        knifeDragRef.current = nextDrag;
        setKnifeDrag(nextDrag);
        return true;
    }, [knifeDragRef, setKnifeDrag, viewport.zoom]);

    const handleSelectionPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (selectionPointerRef.current !== event.pointerId) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const worldX = (event.clientX - rect.left - viewport.x) / viewport.zoom;
        const worldY = (event.clientY - rect.top - viewport.y) / viewport.zoom;
        setSelectionBox(current => current ? { ...current, currentX: worldX, currentY: worldY } : current);
    }, [canvasRef, selectionPointerRef, setSelectionBox, viewport]);

    const handleKnifePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const knifeDragState = knifeDragRef.current;
        if (!knifeDragState || knifeDragState.pointerId !== event.pointerId) return false;

        const pointerWorld = getWorldPointFromClient(event.clientX, event.clientY);
        const knifePoints = pointerWorld
            && getPointDistance(knifeDragState.points[knifeDragState.points.length - 1], pointerWorld) >= MIN_KNIFE_POINT_DISTANCE / viewport.zoom
            ? [...knifeDragState.points, pointerWorld]
            : knifeDragState.points;

        if (knifePoints.length > 1) {
            const nodeById = new Map(nodes.map(node => [node.id, node]));
            const tolerance = KNIFE_HIT_TOLERANCE / viewport.zoom;
            const cutEdgeIds = new Set(edges
                .filter(edge => {
                    const sourceNode = nodeById.get(edge.sourceNodeId);
                    const targetNode = nodeById.get(edge.targetNodeId);
                    if (!sourceNode || !targetNode) return false;

                    const edgePoints = getEdgePolyline(
                        getPortPosition(sourceNode, edge.sourcePort ?? DEFAULT_OUTPUT_PORT, 'output'),
                        getPortPosition(targetNode, edge.targetPort ?? DEFAULT_INPUT_PORT, 'input'),
                    );

                    return polylinesIntersect(knifePoints, edgePoints, tolerance);
                })
                .map(edge => edge.id));

            if (cutEdgeIds.size > 0) {
                const nextEdges = [...edges];
                cutEdgeIds.forEach(edgeId => {
                    const edgeIndex = nextEdges.findIndex(edge => edge.id === edgeId);
                    if (edgeIndex >= 0) nextEdges.splice(edgeIndex, 1);
                });

                if (nextEdges.length !== edges.length) {
                    recordHistory();
                    setEdges(nextEdges);
                }
            }
        }

        knifeDragRef.current = null;
        setKnifeDrag(null);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        return true;
    }, [edges, getWorldPointFromClient, knifeDragRef, nodes, recordHistory, setEdges, setKnifeDrag, viewport.zoom]);

    const handleSelectionPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (selectionPointerRef.current !== event.pointerId) return;

        selectionPointerRef.current = null;
        setSelectionBox(current => {
            if (!current) return null;

            setSelectedNodeIds(getMarqueeSelectedNodeIds(nodes, current));

            return null;
        });
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    }, [nodes, selectionPointerRef, setSelectedNodeIds, setSelectionBox]);

    return {
        handleKnifePointerMove,
        handleKnifePointerUp,
        handleSelectionPointerDown,
        handleSelectionPointerMove,
        handleSelectionPointerUp,
    };
}
