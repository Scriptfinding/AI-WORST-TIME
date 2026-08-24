import styled from 'styled-components';

export const NodalCodePreview = styled.div<{ $readOnly?: boolean }>`
    position: absolute;
    inset: 0;
    z-index: 12;
    background: ${({ $readOnly, theme }) => $readOnly
        ? (theme.mode === 'dark' ? '#15151a' : theme.colors.bg.tertiary)
        : theme.colors.bg.primary};

    .monaco-editor,
    .monaco-editor .margin,
    .monaco-editor .monaco-scrollable-element,
    .monaco-editor .overflow-guard,
    .monaco-editor .lines-content,
    .monaco-editor .view-overlays,
    .monaco-editor-background,
    .monaco-editor .inputarea.ime-input {
        background-color: ${({ $readOnly, theme }) => $readOnly
        ? (theme.mode === 'dark' ? '#15151a' : theme.colors.bg.tertiary)
        : theme.colors.bg.primary} !important;
    }

    .nop-run-line-passed {
        background: rgba(34, 197, 94, 0.10);
    }

    .nop-run-line-active {
        background: rgba(34, 197, 94, 0.18);
        animation: nop-run-line-pulse 1.2s ease-in-out infinite;
    }

    .nop-run-line-error {
        background: rgba(239, 68, 68, 0.18);
    }

    .nop-run-line-passed-gutter {
        border-left: 3px solid rgba(34, 197, 94, 0.65);
    }

    .nop-run-line-active-gutter {
        border-left: 3px solid #22c55e;
        box-shadow: inset 3px 0 0 #22c55e;
    }

    .nop-run-line-error-gutter {
        border-left: 3px solid #ef4444;
        box-shadow: inset 3px 0 0 #ef4444;
    }

    @keyframes nop-run-line-pulse {
        0%, 100% { background: rgba(34, 197, 94, 0.14); }
        50% { background: rgba(34, 197, 94, 0.25); }
    }
`;
