import styled from 'styled-components';

export const CodePane = styled.div<{ $readOnly?: boolean }>`
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;

    .nop-undefined-symbol-line {
        background-color: ${({ theme }) => theme.mode === 'dark'
            ? 'rgba(239, 68, 68, 0.12)'
            : 'rgba(220, 38, 38, 0.09)'};
    }

    .nop-undefined-symbol-glyph {
        width: 9px !important;
        height: 14px !important;
        margin: 3px auto 0;
        transform: translateX(8px);
        background: #ef4444;
        clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%);
    }

    ${({ $readOnly, theme }) => $readOnly && `
        .monaco-editor,
        .monaco-editor .margin,
        .monaco-editor .monaco-scrollable-element,
        .monaco-editor .overflow-guard,
        .monaco-editor-background,
        .monaco-editor .inputarea.ime-input {
            background-color: ${theme.mode === 'dark' ? '#15151a' : theme.colors.bg.tertiary} !important;
        }
    `}

`;
