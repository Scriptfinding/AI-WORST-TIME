import styled from 'styled-components';
import { EmptyText } from '@/Domains/Flow/Pages/FlowEditor/Panes/WelcomePane/shared.styled';

export { EmptyText };

export const ReadmeSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const ReadmeHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

export const ReadmeTitle = styled.h3`
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin: 0;
    display: flex;
    align-items: center;
    gap: 5px;
`;

export const ReadmeEditBtn = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    transition: all ${({ theme }) => theme.transition.fast};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme }) => theme.colors.accent.primary}10;
    }

    svg { width: 12px; height: 12px; }
`;

export const ReadmeEditor = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const ReadmeTextarea = styled.textarea`
    font-size: 13px;
    font-family: ${({ theme }) => theme.font.mono};
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 12px;
    min-height: 200px;
    resize: vertical;
    outline: none;
    line-height: 1.6;

    &:focus {
        border-color: ${({ theme }) => theme.colors.border.focus};
    }
`;

export const ReadmeActions = styled.div`
    display: flex;
    gap: 6px;
    justify-content: flex-end;
`;

export const MarkdownBody = styled.div`
    font-size: 13px;
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.text.secondary};
    word-wrap: break-word;

    h1, h2, h3, h4, h5, h6 {
        color: ${({ theme }) => theme.colors.text.primary};
        margin: 16px 0 8px;
        line-height: 1.3;
    }
    h1 { font-size: 18px; }
    h2 { font-size: 16px; }
    h3 { font-size: 14px; }

    p { margin: 0 0 8px; }

    ul, ol {
        margin: 0 0 8px;
        padding-left: 20px;
    }

    li { margin-bottom: 4px; }

    code {
        font-family: ${({ theme }) => theme.font.mono};
        font-size: 12px;
        padding: 1px 5px;
        border-radius: ${({ theme }) => theme.radius.xs};
        background: ${({ theme }) => theme.colors.bg.tertiary};
        color: ${({ theme }) => theme.colors.text.primary};
    }

    pre {
        background: ${({ theme }) => theme.colors.bg.tertiary};
        border: 1px solid ${({ theme }) => theme.colors.border.default};
        border-radius: ${({ theme }) => theme.radius.md};
        padding: 12px;
        overflow-x: auto;
        margin: 0 0 8px;

        code {
            padding: 0;
            background: transparent;
        }
    }

    a {
        color: ${({ theme }) => theme.colors.accent.primary};
        text-decoration: none;
        &:hover { text-decoration: underline; }
    }

    blockquote {
        margin: 0 0 8px;
        padding: 4px 12px;
        border-left: 3px solid ${({ theme }) => theme.colors.border.default};
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    hr {
        border: none;
        border-top: 1px solid ${({ theme }) => theme.colors.border.default};
        margin: 12px 0;
    }

    table {
        border-collapse: collapse;
        width: 100%;
        margin: 0 0 8px;
    }

    th, td {
        border: 1px solid ${({ theme }) => theme.colors.border.default};
        padding: 6px 10px;
        font-size: 12px;
        text-align: left;
    }

    th {
        background: ${({ theme }) => theme.colors.bg.tertiary};
        font-weight: 600;
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const ReadmeEmpty = styled.div`
    padding: 24px;
    text-align: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    border: 1px dashed ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary}60;
        color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme }) => theme.colors.accent.primary}05;
    }

    svg { width: 16px; height: 16px; margin-bottom: 4px; }
`;
