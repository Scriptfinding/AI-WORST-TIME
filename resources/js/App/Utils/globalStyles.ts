import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
    *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    html {
        --pf-border-default: ${({ theme }) => theme.colors.border.default};

        color-scheme: ${({ theme }) => theme.mode};
        font-size: 14px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    body {
        font-family: ${({ theme }) => theme.font.sans};
        background: ${({ theme }) => theme.colors.bg.primary};
        color: ${({ theme }) => theme.colors.text.primary};
        line-height: 1.5;
        overflow-x: hidden;
        transition: background 200ms ease, color 200ms ease;
    }

    a {
        color: inherit;
        text-decoration: none;
    }

    button {
        cursor: pointer;
        border: none;
        background: none;
        font-family: inherit;
        font-size: inherit;
    }

    input, textarea, select {
        font-family: inherit;
        font-size: inherit;
    }

    ::selection {
        background: ${({ theme }) => theme.colors.accent.primary};
        color: white;
    }

    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.colors.border.light};
        border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: ${({ theme }) => theme.colors.text.tertiary};
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .workbench-hover-container {
        display: none !important;
    }

    /* Monaco reference decorations: the ID stays in the buffer, the
       human-readable label is rendered next to it as injected text. */
    .monaco-editor .pf-ref-id {
        opacity: 0.45;
    }

    /* Must not alter layout metrics (no margin/padding/font-size): Monaco maps
       columns to pixels assuming the editor font, so any width change here
       shifts the caret on the whole line. Horizontal padding is emulated with
       non-breaking spaces injected in the label content itself. */
    .monaco-editor .pf-ref-label {
        border-radius: 4px;
        background: ${({ theme }) => theme.colors.accent.infoBg};
        color: ${({ theme }) => theme.colors.accent.info};
    }
`;
