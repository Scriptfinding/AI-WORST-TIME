import styled from 'styled-components';
import * as Layout from '@/Domains/Snippet/Pages/shared.styled';

export const EditorWithHelp = styled.div`
    position: relative;
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
`;

export const EditorColumn = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
`;

export const EditorWrap = styled.div<{ $readOnly?: boolean }>`
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;

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

export const CodeTitle = styled(Layout.PanelTitle)`
    color: inherit;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 12px;
    font-weight: 400;
`;

export const CodeFooter = styled(Layout.PanelHeader)`
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    border-bottom: none;
`;

export const SavedIndicator = styled.span<{ $saved: boolean; $visible: boolean }>`
    font-size: 11px;
    color: ${({ $saved, theme }) =>
        $saved ? theme.colors.accent.success : theme.colors.accent.warning};
    opacity: ${({ $visible }) => $visible ? 1 : 0};
    transition: opacity 0.4s ease;
    pointer-events: ${({ $visible }) => $visible ? 'auto' : 'none'};
`;

export const SaveBadge = styled.button<{ $disabled?: boolean }>`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
    pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};
    svg { width: 14px; height: 14px; }
    &:hover {
        background: ${({ theme }) => theme.colors.accent.primary}18;
        color: ${({ theme }) => theme.colors.accent.primary};
        border-color: ${({ theme }) => theme.colors.accent.primary}40;
    }
`;

export const SaveIconWrapper = styled.span`
    position: relative;
    display: flex;
    align-items: center;
`;

export const UnsavedDot = styled.span`
    position: absolute;
    top: -3px;
    right: -3px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accent.warning};
    animation: breathe 2s ease-in-out infinite;
    @keyframes breathe {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.7); }
    }
`;

export const SyntaxKeyword = styled.span`
    color: ${({ theme }) => theme.mode === 'dark' ? '#569cd6' : '#0000ff'};
`;

export const SyntaxFunction = styled.span`
    color: ${({ theme }) => theme.mode === 'dark' ? '#dcdcaa' : '#795e26'};
`;

export const SyntaxParen = styled.span`
    color: ${({ theme }) => theme.mode === 'dark' ? '#ffd700' : '#0431fa'};
`;

export const SyntaxParam = styled.span`
    color: ${({ theme }) => theme.mode === 'dark' ? '#9cdcfe' : '#001080'};
`;

export const SyntaxBrace = styled.span`
    color: ${({ theme }) => theme.mode === 'dark' ? '#ffd700' : '#0431fa'};
`;

export const ToolbarSeparator = styled.div`
    width: 1px;
    height: 18px;
    background: ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;

    @media (max-width: 768px) {
        display: none;
    }
`;
