import styled from 'styled-components';

export const ExpressionFullscreenBackdrop = styled.div`
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: ${({ theme }) => theme.colors.bg.primary}dd;
    backdrop-filter: blur(4px);
    z-index: 1200;
    user-select: text;
`;

export const ExpressionFullscreenPanel = styled.div`
    width: calc(100vw - 32px);
    height: calc(100vh - 32px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: ${({ theme }) => theme.radius.lg};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    user-select: text;
`;

export const ExpressionFullscreenHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 13px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};

    strong {
        display: block;
        font-size: 14px;
        color: ${({ theme }) => theme.colors.text.primary};
    }

    span {
        display: block;
        margin-top: 2px;
        font-size: 11px;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const ClosePicker = styled.button`
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const ExpressionFullscreenBody = styled.div<{ $codeInput?: boolean }>`
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: ${({ $codeInput }) => (
        $codeInput
            ? 'minmax(260px, 0.75fr) minmax(420px, 1.5fr)'
            : 'minmax(260px, 0.85fr) minmax(420px, 1.35fr) minmax(260px, 0.85fr)'
    )};
    gap: 12px;
    padding: 12px;
    background: ${({ theme }) => theme.colors.bg.primary};

    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
    }
`;

export const ExpressionFullscreenEditor = styled.div`
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-radius: ${({ theme }) => theme.radius.lg};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    overflow: hidden;

    .monaco-editor,
    .monaco-editor .margin,
    .monaco-editor-background,
    .monaco-editor .inputarea.ime-input {
        background-color: ${({ theme }) => theme.colors.bg.primary} !important;
    }

    .monaco-editor .editorPlaceholder {
        white-space: pre;
    }

    .nop-template-token {
        color: ${({ theme }) => theme.colors.accent.success} !important;
        background: ${({ theme }) => theme.colors.accent.successBg};
        border-radius: 3px;
    }
`;

export const ExpressionRenderPanel = styled.div`
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-radius: ${({ theme }) => theme.radius.lg};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    overflow: hidden;
`;

export const ExpressionRenderHeader = styled.div`
    padding: 9px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};

    strong {
        display: block;
        font-size: 12px;
        color: ${({ theme }) => theme.colors.text.primary};
    }

    span {
        display: block;
        margin-top: 2px;
        font-size: 10px;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const ExpressionRenderBody = styled.div<{ $error?: boolean }>`
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 12px;
    background: ${({ theme }) => theme.colors.bg.primary};

    pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: ${({ theme }) => theme.font.mono};
        font-size: 12px;
        line-height: 1.55;
        color: ${({ theme, $error }) => ($error ? theme.colors.accent.error : theme.colors.text.primary)};
    }
`;
