import styled from 'styled-components';
import type { StickyNoteColor } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { stickyNoteColors } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/components/CanvasNode/StickyNoteCard/colors';

export const Body = styled.div<{ $color: StickyNoteColor; $customColor?: string }>`
    flex: 1;
    min-height: 0;
    padding: 14px;
    overflow: hidden;
    font-size: 13px;
    line-height: 1.5;
    color: ${({ $color, $customColor, theme }) => stickyNoteColors($color, $customColor, theme.mode).text};
    user-select: text;
    word-break: break-all;

    h1, h2, h3, h4, p, ul, ol, pre, blockquote {
        margin-top: 0;
        margin-bottom: 8px;
    }

    p {
        white-space: pre-wrap;
    }

    ul, ol {
        padding-left: 18px;
    }

    img {
        max-width: 100%;
        height: auto;
        border-radius: 6px;
        display: block;
        margin: 6px 0;
    }

    u {
        text-decoration-thickness: 1px;
        text-underline-offset: 2px;
    }

    a {
        color: ${({ $color, $customColor, theme }) => stickyNoteColors($color, $customColor, theme.mode).muted};
        text-decoration: underline;
        text-decoration-thickness: 1px;
        text-underline-offset: 2px;
        font-weight: 500;

        &:hover {
            color: ${({ $color, $customColor, theme }) => stickyNoteColors($color, $customColor, theme.mode).text};
        }
    }

    code {
        padding: 1px 4px;
        border-radius: 5px;
        background: rgba(15, 23, 42, 0.09);
        font-family: ${({ theme }) => theme.font.mono};
        font-size: 0.92em;
    }
`;

export const Editor = styled.textarea<{ $color: StickyNoteColor; $customColor?: string }>`
    flex: 1;
    width: 100%;
    min-height: 0;
    padding: 14px;
    border: 0;
    outline: 0;
    resize: none;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.elevated};
    font: inherit;
    line-height: 1.5;
    overflow: auto;
    word-break: break-all;
    border-radius: ${({ theme }) => theme.radius.sm};
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border.default};

    &:focus {
        box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border.focus};
    }
`;

export const Placeholder = styled.p<{ $color: StickyNoteColor; $customColor?: string }>`
    margin: 0;
    color: ${({ $color, $customColor, theme }) => stickyNoteColors($color, $customColor, theme.mode).muted};
`;
