import { useEffect } from 'react';
import { snapCanvasPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/grid';
import { getDirectionalPushNodeIds } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/movement';
import type { UseNodalEditorEffectsOptions } from './useNodalEditorEffects.types';

type UseNodeTransformSessionOptions = Pick<UseNodalEditorEffectsOptions,
    | 'getWorldPointFromClient'
    | 'lastPointerWorldRef'
    | 'setNodes'
    | 'setTransformMode'
    | 'transformMode'
>;

// Tracks node move and resize gestures as single undoable graph operations.
export function useNodeTransformSession({
    getWorldPointFromClient,
    lastPointerWorldRef,
    setNodes,
    setTransformMode,
    transformMode,
}: UseNodeTransformSessionOptions) {
    useEffect(() => {
        if (!transformMode) return;

        const originalPositions = (transformMode.kind === 'move'
            ? transformMode.allNodePositions
            : transformMode.nodePositions).map(position => ({ ...position }));
        let constrainedAxis: 'horizontal' | 'vertical' | null = null;

        const updateFromPointer = (
            clientX: number,
            clientY: number,
            constrainToAxis = false,
            pushNodes = false,
        ) => {
            const pointerWorld = getWorldPointFromClient(clientX, clientY);
            if (!pointerWorld) return;

            lastPointerWorldRef.current = pointerWorld;

            if (transformMode.kind === 'move') {
                let dx = pointerWorld.x - transformMode.origin.x;
                let dy = pointerWorld.y - transformMode.origin.y;
                if (constrainToAxis) {
                    constrainedAxis ??= Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
                    if (constrainedAxis === 'horizontal') dy = 0;
                    else dx = 0;
                } else {
                    constrainedAxis = null;
                }
                const movedNodeIds = new Set(transformMode.nodePositions.map(position => position.id));
                const pushedNodeIds = pushNodes
                    ? getDirectionalPushNodeIds(
                        transformMode.allNodePositions,
                        transformMode.nodePositions,
                        dx,
                        dy,
                    )
                    : new Set<string>();
                const positionById = new Map(transformMode.allNodePositions.map(position => [position.id, position]));

                setNodes(current => current.map(node => {
                    const position = positionById.get(node.id);
                    if (!position) return node;
                    if (!movedNodeIds.has(node.id) && !pushedNodeIds.has(node.id)) {
                        return { ...node, x: position.x, y: position.y };
                    }

                    return {
                        ...node,
                        x: position.movementAxis === 'vertical'
                            ? position.x
                            : snapCanvasPosition(position.x + dx),
                        y: snapCanvasPosition(position.y + dy),
                    };
                }));
                return;
            }

            const [firstNode, secondNode] = transformMode.nodePositions;
            const pointerDx = pointerWorld.x - transformMode.origin.x;
            const pointerDy = pointerWorld.y - transformMode.origin.y;
            const projected = pointerDx * transformMode.axis.x + pointerDy * transformMode.axis.y;
            const progress = Math.max(0, Math.min(1, Math.abs(projected) / transformMode.distance));
            const nextFirst = {
                x: firstNode.x + (secondNode.x - firstNode.x) * progress,
                y: firstNode.y + (secondNode.y - firstNode.y) * progress,
            };
            const nextSecond = {
                x: secondNode.x + (firstNode.x - secondNode.x) * progress,
                y: secondNode.y + (firstNode.y - secondNode.y) * progress,
            };

            setNodes(current => current.map(node => {
                if (node.id === firstNode.id) return { ...node, ...nextFirst };
                if (node.id === secondNode.id) return { ...node, ...nextSecond };
                return node;
            }));
        };

        const handlePointerMove = (event: PointerEvent) => {
            updateFromPointer(event.clientX, event.clientY, event.shiftKey, event.altKey);
        };

        const handlePointerDown = (event: PointerEvent) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            updateFromPointer(event.clientX, event.clientY, event.shiftKey, event.altKey);
            if (transformMode.kind === 'move') {
                const originalPositionById = new Map(transformMode.allNodePositions.map(position => [position.id, position]));
                setNodes(current => current.map(node => {
                    const originalPosition = originalPositionById.get(node.id);
                    if (!originalPosition || (node.x === originalPosition.x && node.y === originalPosition.y)) return node;
                    return { ...node, x: snapCanvasPosition(node.x), y: snapCanvasPosition(node.y) };
                }));
            }
            setTransformMode(null);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;

            event.preventDefault();
            event.stopImmediatePropagation();
            const positionById = new Map(originalPositions.map(position => [position.id, position]));
            setNodes(current => current.map(node => {
                const position = positionById.get(node.id);
                return position ? { ...node, x: position.x, y: position.y } : node;
            }));
            setTransformMode(null);
        };

        window.addEventListener('pointermove', handlePointerMove, true);
        window.addEventListener('pointerdown', handlePointerDown, true);
        window.addEventListener('keydown', handleKeyDown, true);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove, true);
            window.removeEventListener('pointerdown', handlePointerDown, true);
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [getWorldPointFromClient, lastPointerWorldRef, setNodes, setTransformMode, transformMode]);
}
