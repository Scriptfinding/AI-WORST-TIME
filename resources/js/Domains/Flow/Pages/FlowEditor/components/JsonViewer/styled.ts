import styled from 'styled-components';

export const JsonViewerWrapper = styled.div<{ $maxHeight?: number; $fill?: boolean }>`
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    overflow: hidden;
    ${({ $fill }) => $fill ? 'flex: 1; min-height: 0; height: 100%; width: 100%;' : ''}
    ${({ $maxHeight }) => $maxHeight ? `max-height: ${$maxHeight}px;` : ''}

    .monaco-editor,
    .monaco-editor .margin,
    .monaco-editor-background,
    .monaco-editor .inputarea.ime-input {
        background-color: ${({ theme }) => theme.colors.bg.primary} !important;
    }
`;
