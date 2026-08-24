import styled from 'styled-components';

export const Wrapper = styled.div<{ $flatBottom?: boolean }>`
    display: flex;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme, $flatBottom }) =>
        $flatBottom
            ? `${theme.radius.md} ${theme.radius.md} 0 0`
            : theme.radius.md};
    overflow: hidden;
    flex: 1;
    min-height: ${({ $flatBottom }) => $flatBottom ? '0' : '320px'};

    > * {
        flex: 1;
        min-height: 0;
    }

    .monaco-editor,
    .monaco-editor .margin,
    .monaco-editor-background,
    .monaco-editor .inputarea.ime-input {
        background-color: ${({ theme }) => theme.colors.bg.tertiary} !important;
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
