import styled from 'styled-components';
import type { StickyNoteColor } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { stickyNoteColors } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/CanvasNode/StickyNoteCard/colors';

export const Wrap = styled.div`
    position: relative;
`;

export const Palette = styled.div`
    position: absolute;
    top: 24px;
    right: 0;
    display: grid;
    grid-template-columns: repeat(5, 17px);
    gap: 6px;
    padding: 7px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.md};
    opacity: 0;
    pointer-events: none;
    transition: opacity ${({ theme }) => theme.transition.fast};
    z-index: 10;

    ${Wrap}:hover &,
    ${Wrap}:focus-within & {
        opacity: 1;
        pointer-events: auto;
    }
`;

export const ColorButton = styled.button<{ $color: StickyNoteColor; $active?: boolean }>`
    width: 17px;
    height: 17px;
    border-radius: 999px;
    border: 1px solid ${({ $color, theme }) => stickyNoteColors($color, undefined, theme.mode).border};
    background: ${({ $color, theme }) => stickyNoteColors($color, undefined, theme.mode).background};
    box-shadow: ${({ $active, $color, theme }) => $active
        ? `0 0 0 2px ${stickyNoteColors($color, undefined, theme.mode).border}55`
        : 'none'};
    cursor: pointer;
`;

export const CustomColorButton = styled.label<{ $color: string; $active?: boolean }>`
    position: relative;
    width: 17px;
    height: 17px;
    border-radius: 999px;
    border: 1px solid ${({ $color }) => $color};
    background: ${({ $color }) => $color};
    box-shadow: ${({ $active, $color }) => $active ? `0 0 0 2px ${$color}55` : 'none'};
    cursor: pointer;
    overflow: hidden;

    input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
    }

    &::after {
        content: '';
        position: absolute;
        inset: 4px;
        border-radius: inherit;
        border: 1px solid rgba(255, 255, 255, 0.75);
        box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.22);
        pointer-events: none;
    }
`;
