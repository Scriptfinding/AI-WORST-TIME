import styled from 'styled-components';
import type { StickyNoteColor } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { stickyNoteColors } from './colors';

export const StickyNote = styled.div<{ $selected?: boolean; $selectionPreview?: boolean; $color: StickyNoteColor; $customColor?: string; $width: number; $height: number }>`
    position: absolute;
    width: ${({ $width }) => $width}px;
    height: ${({ $height }) => $height}px;
    display: flex;
    flex-direction: column;
    transform: translate(-50%, -50%);
    border-radius: 4px;
    border: 1px solid ${({ $color, $customColor, theme }) => `${stickyNoteColors($color, $customColor, theme.mode).border}80`};
    background: ${({ $color, $customColor, theme }) => stickyNoteColors($color, $customColor, theme.mode).background};
    color: ${({ $color, $customColor, theme }) => stickyNoteColors($color, $customColor, theme.mode).text};
    box-shadow: ${({ $selected, $selectionPreview, $color, $customColor, theme }) => $selectionPreview
        ? `0 0 0 3px ${theme.colors.border.light}, 0 0 0 6px ${theme.colors.border.default}, ${theme.shadow.md}`
        : $selected
        ? theme.mode === 'dark'
            ? `0 0 0 3px ${stickyNoteColors($color, $customColor, theme.mode).border}, 0 0 0 6px ${stickyNoteColors($color, $customColor, theme.mode).border}35, ${theme.shadow.md}`
            : `0 0 0 3px ${stickyNoteColors($color, $customColor, theme.mode).border}45, ${theme.shadow.md}`
        : theme.shadow.sm};
    cursor: grab;
    overflow: visible;
    z-index: -1;

    &:active {
        cursor: grabbing;
    }
`;

export const StickyNoteHoverActions = styled.div`
    position: absolute;
    left: 50%;
    top: -24px;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px;
    transform: translateX(-50%);
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.sm};
    opacity: 0;
    pointer-events: none;
    transition: opacity ${({ theme }) => theme.transition.fast};
    z-index: 8;

    ${StickyNote}:hover &,
    ${StickyNote}[data-selected='true'] & {
        opacity: 1;
        pointer-events: auto;
    }
`;
