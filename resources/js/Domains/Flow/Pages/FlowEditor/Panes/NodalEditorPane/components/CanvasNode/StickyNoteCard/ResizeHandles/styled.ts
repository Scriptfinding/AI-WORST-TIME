import styled from 'styled-components';
import type { StickyNoteColor } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { stickyNoteColors } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/CanvasNode/StickyNoteCard/colors';

const resizeHandlePosition = (direction: string) => {
    const vertical = direction.includes('n')
        ? direction.length === 1 ? 'top: -8px; left: 16px; right: 16px;' : 'top: -8px;'
        : direction.includes('s')
            ? direction.length === 1 ? 'bottom: -8px; left: 16px; right: 16px;' : 'bottom: -8px;'
            : 'top: 16px; bottom: 16px;';
    const horizontal = direction.includes('w')
        ? direction.length === 1 ? 'left: -8px; top: 16px; bottom: 16px;' : 'left: -8px;'
        : direction.includes('e')
            ? direction.length === 1 ? 'right: -8px; top: 16px; bottom: 16px;' : 'right: -8px;'
            : 'left: 16px; right: 16px;';

    if (!direction.includes('n') && !direction.includes('s')) return `${vertical} ${horizontal}`;
    if (!direction.includes('w') && !direction.includes('e')) return `${vertical} ${horizontal}`;
    return `${vertical} ${horizontal}`;
};

const resizeHandleCursor = (direction: string) => {
    if (direction === 'n' || direction === 's') return 'ns-resize';
    if (direction === 'e' || direction === 'w') return 'ew-resize';
    if (direction === 'ne' || direction === 'sw') return 'nesw-resize';
    return 'nwse-resize';
};

const resizeHandleIndicatorInset = (direction: string) => {
    if (direction === 'n' || direction === 's') return '7px 0';
    if (direction === 'e' || direction === 'w') return '0 7px';
    return '5px';
};

export const StickyNoteResizeHandle = styled.div<{ $color: StickyNoteColor; $direction: string }>`
    position: absolute;
    ${({ $direction }) => resizeHandlePosition($direction)}
    width: ${({ $direction }) => ($direction === 'n' || $direction === 's') ? 'auto' : '16px'};
    height: ${({ $direction }) => ($direction === 'n' || $direction === 's') ? '16px' : ($direction === 'e' || $direction === 'w') ? 'auto' : '16px'};
    cursor: ${({ $direction }) => resizeHandleCursor($direction)};
    pointer-events: auto;

    &::after {
        content: '';
        position: absolute;
        inset: ${({ $direction }) => resizeHandleIndicatorInset($direction)};
        border-radius: ${({ $direction }) => $direction.length === 1 ? '999px' : '3px'};
        background: ${({ $color, theme }) => `${stickyNoteColors($color, undefined, theme.mode).border}99`};
        opacity: 0;
        transition: opacity ${({ theme }) => theme.transition.fast};
    }

    &:hover::after {
        opacity: 1;
    }
`;
