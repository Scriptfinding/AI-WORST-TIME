import { useEffect, useState, type DragEvent } from 'react';
import type { FormField } from '@/Domains/Flow/Pages/FlowEditor/components/StructuredObjectInput/utils';
import { reorderFields } from '../utils';

interface UseFieldReorderingOptions {
    fields: FormField[];
    onChange: (fields: FormField[]) => void;
    onDragStart?: () => void;
}

export function useFieldReordering({
    fields,
    onChange,
    onDragStart,
}: UseFieldReorderingOptions) {
    const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
    const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null);
    const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after'>('before');

    const clearDrag = () => {
        setDraggedFieldId(null);
        setDragOverFieldId(null);
    };

    const dropField = (targetFieldId: string, position: 'before' | 'after') => {
        if (!draggedFieldId) return;
        const nextFields = reorderFields(fields, draggedFieldId, targetFieldId, position);
        if (nextFields) onChange(nextFields);
    };

    const handleDragStart = (event: DragEvent<HTMLButtonElement>, fieldId: string) => {
        onDragStart?.();
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', fieldId);
        setDraggedFieldId(fieldId);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>, fieldId: string) => {
        if (!draggedFieldId) return;
        if (draggedFieldId === fieldId) {
            setDragOverFieldId(null);
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDragOverFieldId(fieldId);
        const rect = event.currentTarget.getBoundingClientRect();
        setDragOverPosition(event.clientY < rect.top + rect.height / 2 ? 'before' : 'after');
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>, fieldId: string) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
        dropField(fieldId, position);
        clearDrag();
    };

    useEffect(() => {
        if (!draggedFieldId || !dragOverFieldId) return;

        const handleWindowDragOver = (event: globalThis.DragEvent) => {
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        };
        const handleWindowDrop = (event: globalThis.DragEvent) => {
            event.preventDefault();
            const nextFields = reorderFields(
                fields,
                draggedFieldId,
                dragOverFieldId,
                dragOverPosition,
            );
            if (nextFields) onChange(nextFields);
            clearDrag();
        };

        window.addEventListener('dragover', handleWindowDragOver);
        window.addEventListener('drop', handleWindowDrop);
        return () => {
            window.removeEventListener('dragover', handleWindowDragOver);
            window.removeEventListener('drop', handleWindowDrop);
        };
    }, [dragOverFieldId, dragOverPosition, draggedFieldId, fields, onChange]);

    return {
        draggedFieldId,
        dragOverFieldId,
        dragOverPosition,
        handleDragStart,
        handleDragOver,
        handleDrop,
        clearDrag,
    };
}
