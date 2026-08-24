import styled from 'styled-components';

export const CodeNodeField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const CodeNodeEditor = styled.div`
    width: 100%;
    height: min(52vh, 520px);
    min-height: 280px;
    overflow: hidden;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};

    &:focus-within {
        border-color: ${({ theme }) => theme.colors.border.default};
        box-shadow: none;
    }

    .monaco-editor,
    .monaco-editor .margin,
    .monaco-editor-background,
    .monaco-editor .inputarea.ime-input {
        background-color: ${({ theme }) => theme.colors.bg.primary} !important;
    }
`;

export const ExpressionHint = styled.div`
    font-size: 10px;
    line-height: 1.4;
    color: ${({ theme }) => theme.colors.text.tertiary};

    code {
        font-family: ${({ theme }) => theme.font.mono};
        color: ${({ theme }) => theme.colors.text.secondary};
    }
`;
